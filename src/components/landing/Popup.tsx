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

      if (supabase) {
        try {
          const { data } = await supabase.from('popups').select('*').eq('active', true).order('created_at', { ascending: false }).limit(1);
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
          const popup = list.find((p: any) => p.active);
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
          <button onClick={close} className="text-muted-foreground">Fechar</button>
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
              className={`text-left mt-3 ${item.course_id ? 'cursor-pointer' : ''}`}
              onClick={item.course_id ? handleClick : undefined}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
