export type Role = 'customer'|'contractor'|'dispatcher'|'admin';
export type VerifiedActor = {id:string;role:Role;active:boolean;aal:string};
export function canAdminister(actor: VerifiedActor) { return actor.active && actor.role==='admin' && actor.aal==='aal2'; }
export function canDispatch(actor: VerifiedActor) { return actor.active && ['admin','dispatcher'].includes(actor.role) && actor.aal==='aal2'; }
