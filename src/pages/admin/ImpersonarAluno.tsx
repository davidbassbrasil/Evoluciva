import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { setPreviewStudentId } from '@/lib/localStorage';
import { formatBRDateTime } from '@/lib/dates';
import { Eye } from 'lucide-react';

export default function AdminImpersonarAluno() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profileId || !supabase) return;
      setLoading(true);
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, full_name, email, whatsapp, cpf, city, state, created_at')
          .eq('id', profileId)
          .single();

        setProfile(prof || null);

        const { data: enrolls } = await supabase
          .from('enrollments')
          .select(`
            id,
            turma_id,
            modality,
            access_expires_at,
            enrolled_at,
            turmas ( id, name, course_id, course:courses ( id, title ) )
          `)
          .eq('profile_id', profileId)
          .order('enrolled_at', { ascending: false });

        setEnrollments(enrolls || []);
      } catch (err) {
        console.error('Error loading impersonation data:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profileId]);

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-yellow-200 text-yellow-900">MODO ADMIN</Badge>
            <h1 className="text-2xl font-bold">Visualizar Dashboard do Aluno</h1>
            <span className="text-muted-foreground">({profile?.full_name || 'Carregando...'})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/alunos')}>Voltar para /admin/alunos</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Aluno</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : profile ? (
                <div className="space-y-2">
                  <div className="font-medium text-lg">{profile.full_name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {profile.email}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {profile.whatsapp || '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">CPF: {profile.cpf || '-'}</div>
                  <div className="text-sm text-muted-foreground">Cidade: {profile.city || '-'} / {profile.state || '-'}</div>
                </div>
              ) : (
                <p className="text-sm text-destructive">Aluno não encontrado</p>
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard (visão administrativa)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Matrículas</h3>
                      {enrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem matrículas</p>
                      ) : (
                        <ul className="space-y-2 mt-2">
                          {enrollments.map((e) => (
                            <li key={e.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{e.turmas?.name || 'Turma'}</div>
                                  <div className="text-sm text-muted-foreground">Curso: {e.turmas?.course?.title || '-'}</div>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">{formatBRDateTime(e.enrolled_at)}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold">Ações</h3>
                      <div className="mt-2 flex gap-2">
                            <Button onClick={() => navigate('/admin/alunos')}>Voltar</Button>
                            <Button onClick={() => window.print()} variant="ghost">Imprimir</Button>
                            <Button
                              onClick={() => {
                                if (!profile?.id) return;
                                setPreviewStudentId(profile.id);
                                window.open('/aluno/dashboard', '_blank');
                              }}
                              variant="ghost"
                            >
                              <Eye className="w-4 h-4" />
                              Entrar como aluno (preview)
                            </Button>
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
