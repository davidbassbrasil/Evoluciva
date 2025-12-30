import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';

export default function Popup() {
  const [item, setItem] = useState<any | null>(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if ((window as any).__popupShownThisLoad) return; // already closed this load

      const nowIso = new Date().toISOString();

      if (supabase) {
        try {
          // deactivate expired popups server-side (best-effort)
          try {
            await supabase.from('popups').update({ active: false }).lte('expires_at', nowIso).eq('active', true);
          } catch (err) {
            // non-fatal
            console.warn('Could not auto-deactivate expired popups:', err);
          }

          // Select one eligible popup: active and not expired. Use queue order (older created first).
          const { data } = await supabase
            .from('popups')
            .select('*')
            .eq('active', true)
            .gt('expires_at', nowIso)
            .order('created_at', { ascending: true })
            .limit(1);

          const popup = data && data.length > 0 ? data[0] : null;
          if (popup) {
            setItem(popup);
            setVisible(true);
          }
        } catch (err) {
          console.error('Error loading popup:', err);
        }
      } else {
        try {
          const raw = localStorage.getItem('cursos_popups');
          const list = raw ? JSON.parse(raw) : [];
          const now = new Date();
          // pick first active popup whose expires_at is in the future
          const popup = list
            .filter((p: any) => p.active && p.expires_at && new Date(p.expires_at) > now)
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          if (popup) {
            setItem(popup);
            setVisible(true);
          }
        } catch {}
      }
    };

    load();
  }, []);

  if (!item || !visible) return null;

  const close = () => {
    setVisible(false);
    try { (window as any).__popupShownThisLoad = true; } catch {}
  };

  const handleClick = () => {
    // mark as shown for this load and close
    try { (window as any).__popupShownThisLoad = true; } catch {}
    setVisible(false);
    if (item?.course_id) {
      navigate(`/curso/${item.course_id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="bg-card p-6 rounded-xl z-10 max-w-xl w-full mx-4">
        <div className="flex justify-end">
          <button onClick={close} className="text-muted-foreground mb-2">X</button>
        </div>
        <div className="text-center">
          {item.title && <h3 className="font-bold text-lg mb-2">{item.title}</h3>}
          {item.type === 'image' && item.image && (
            <img
              src={item.image}
              alt={item.title || 'Popup'}
              className={`mx-auto max-h-[60vh] object-contain ${item.course_id ? 'cursor-pointer' : ''}`}
              onClick={item.course_id ? handleClick : undefined}
            />
          )}
          {item.type === 'text' && item.content && (
            <div
              className={`text-center mt-3 ${item.course_id ? 'cursor-pointer' : ''}`}
              onClick={item.course_id ? handleClick : undefined}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
