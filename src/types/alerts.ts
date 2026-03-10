export type Mezzo = 'treni' | 'aerei' | 'navi' | 'bus';
export type MezzoCheck = 'tutti' | 'treno' | 'aereo' | 'nave' | 'bus';
export type TipoAlert = 'sciopero' | 'cancellazione' | 'ritardo' | 'lavori' | 'evento';
export type Severita = 'alta' | 'media' | 'bassa';

export interface AlertOggi {
  id: string;
  tipo: TipoAlert;
  mezzo: Mezzo;
  operatore: string;
  titolo: string;
  descrizione: string;
  severita: Severita;
  orario?: string;
  fonte?: string;
}

export interface AlertProssimi {
  id: string;
  data: string;
  tipo: TipoAlert;
  mezzo: Mezzo;
  operatore: string;
  titolo: string;
  descrizione: string;
  severita: Severita;
}

export interface AlertData {
  oggi: AlertOggi[];
  prossimi7giorni: AlertProssimi[];
}

export interface SavedWatch {
  date: string;
  mezzo: string;
  note: string;
  saved: string;
}

export type FilterTipo = 'tutti' | 'scioperi' | 'cancellazioni' | 'lavori' | 'ritardi';
export type SectionMezzo = Mezzo | null;
