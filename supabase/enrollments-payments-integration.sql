-- ============================================================================
-- ATUALIZAÇÃO DA TABELA ENROLLMENTS
-- Adiciona campos para vincular com pagamentos
-- ============================================================================

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna payment_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
        CREATE INDEX idx_enrollments_payment_id ON enrollments(payment_id);
    END IF;
    
    -- Adicionar coluna payment_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
        CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);
    END IF;
    
    -- Adicionar coluna payment_method
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN payment_method VARCHAR(50);
    END IF;
    
    -- Adicionar coluna paid_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================================
-- TRIGGER: Auto-aprovar matrícula quando pagamento for confirmado
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_approve_enrollment_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o pagamento foi confirmado ou recebido
    IF NEW.status IN ('CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH') 
       AND (OLD.status IS NULL OR OLD.status NOT IN ('CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH')) THEN
        
        -- Atualizar matrícula relacionada
        UPDATE enrollments
        SET 
            status = 'active',
            payment_status = 'paid',
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.enrollment_id;
        
        RAISE NOTICE 'Matrícula % aprovada automaticamente - Pagamento %', NEW.enrollment_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_approve_enrollment ON payments;
CREATE TRIGGER trigger_auto_approve_enrollment
    AFTER INSERT OR UPDATE OF status ON payments
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_enrollment_on_payment();

-- ============================================================================
-- FUNÇÃO: Criar matrícula e pagamento
-- ============================================================================

CREATE OR REPLACE FUNCTION create_enrollment_with_payment(
    p_user_id UUID,
    p_turma_id UUID,
    p_modality VARCHAR(50),
    p_asaas_payment_id VARCHAR(100),
    p_billing_type VARCHAR(50),
    p_value DECIMAL(10, 2),
    p_due_date DATE,
    p_description TEXT DEFAULT NULL,
    p_external_reference VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE(enrollment_id UUID, payment_id UUID) AS $$
DECLARE
    v_enrollment_id UUID;
    v_payment_id UUID;
BEGIN
    -- Criar matrícula
    INSERT INTO enrollments (
        user_id,
        turma_id,
        modality,
        status,
        payment_status,
        payment_method
    ) VALUES (
        p_user_id,
        p_turma_id,
        p_modality,
        'pending',  -- Status inicial: pendente
        'pending',  -- Aguardando pagamento
        p_billing_type
    ) RETURNING id INTO v_enrollment_id;
    
    -- Criar pagamento
    INSERT INTO payments (
        user_id,
        turma_id,
        enrollment_id,
        asaas_payment_id,
        billing_type,
        status,
        value,
        due_date,
        description,
        external_reference
    ) VALUES (
        p_user_id,
        p_turma_id,
        v_enrollment_id,
        p_asaas_payment_id,
        p_billing_type::payment_type,
        'PENDING',
        p_value,
        p_due_date,
        p_description,
        p_external_reference
    ) RETURNING id INTO v_payment_id;
    
    -- Atualizar enrollment com payment_id
    UPDATE enrollments
    SET payment_id = v_payment_id
    WHERE id = v_enrollment_id;
    
    RETURN QUERY SELECT v_enrollment_id, v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION create_enrollment_with_payment IS 'Cria matrícula e pagamento atomicamente';
COMMENT ON FUNCTION auto_approve_enrollment_on_payment IS 'Aprova matrícula automaticamente quando pagamento for confirmado';
