import type { AlertData, FilterTipo, Mezzo } from '../types/alerts';
import { AlertItemOggi, AlertItemProssimi } from './AlertItem';

const FILTER_MAP: Record<FilterTipo, string | null> = {
  tutti: null,
  scioperi: 'sciopero',
  cancellazioni: 'cancellazione',
  lavori: 'lavori',
  ritardi: 'ritardo',
};

interface AlertListProps {
  data: AlertData | null;
  filter: FilterTipo;
  sectionMezzo: Mezzo | null;
}

export function AlertListToday({ data, filter, sectionMezzo }: AlertListProps) {
  const oggi = data?.oggi ?? [];
  const filteredByMezzo = sectionMezzo
    ? oggi.filter((a) => a.mezzo === sectionMezzo)
    : oggi;
  const tipoFilter = FILTER_MAP[filter];
  const list = tipoFilter
    ? filteredByMezzo.filter((a) => a.tipo === tipoFilter)
    : filteredByMezzo;

  const title = sectionMezzo
    ? `Disagi — ${sectionMezzo === 'treni' ? 'Treni' : sectionMezzo === 'aerei' ? 'Aerei' : sectionMezzo === 'navi' ? 'Navi' : 'Bus'}`
    : 'Disagi attivi oggi';

  if (list.length === 0) {
    const emptyMsg = sectionMezzo
      ? `✅ Nessun disagio per ${sectionMezzo === 'treni' ? 'Treni' : sectionMezzo === 'aerei' ? 'Aerei' : sectionMezzo === 'navi' ? 'Navi' : 'Bus'} oggi`
      : filter !== 'tutti'
        ? 'Nessun elemento per questo filtro'
        : '✅ Nessun disagio confermato per oggi';
    return (
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            <span>⚠️</span>
            <span>{title}</span>
          </div>
          <div className="badge red">0</div>
        </div>
        <div className="section-body">
          <div className="alert-list">
            <div className="empty-state">{emptyMsg}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">
          <span>⚠️</span>
          <span>{title}</span>
        </div>
        <div className="badge red">{list.length}</div>
      </div>
      <div className="section-body">
        <div className="alert-list">
          {list.map((a) => (
            <AlertItemOggi key={a.id} alert={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AlertListUpcoming({ data }: { data: AlertData | null }) {
  const prossimi = data?.prossimi7giorni ?? [];

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">
          <span>📅</span>
          <span>Prossimi 7 giorni</span>
        </div>
        <div className="badge yellow">{prossimi.length}</div>
      </div>
      <div className="section-body">
        <div className="alert-list">
          {prossimi.length === 0 ? (
            <div className="empty-state">
              ✅ Nessun disagio previsto nei prossimi 7 giorni
            </div>
          ) : (
            prossimi.map((a) => (
              <AlertItemProssimi key={a.id} alert={a} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
