Formato dos campos `weekdays` e `sessions`

- `weekdays` (text[]): lista de dias codificados por abreviação em inglês: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`.
  - Exemplo: `['Mon','Wed']`

- `sessions` (jsonb): array de objetos com `day` (uma das abreviações acima), `start` e `end` no formato `HH:MM`.
  - Exemplo:
    ```json
    [
      { "day": "Mon", "start": "18:30", "end": "20:00" },
      { "day": "Wed", "start": "18:30", "end": "20:00" }
    ]
    ```

Notas:
- O admin já permite selecionar dias e adicionar horários; há validação básica no frontend para garantir que `start` e `end` estejam no formato `HH:MM` e que `start` < `end`.
- Na interface pública de venda, as sessions são exibidas com rótulos em PT-BR abreviados: `Seg.`, `Ter.`, `Qua.`, `Qui.`, `Sex.`, `Sáb.`, `Dom.`
