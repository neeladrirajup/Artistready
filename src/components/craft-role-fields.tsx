'use client';
import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { rolesForCraft } from '@/lib/craft-roles';
import type { Draft } from '@/lib/profile-model';

export function CraftRoleFields({ value, onChange }: { value: Draft; onChange: (value: Draft) => void }) {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<readonly string[] | null>(null);
  useEffect(() => {
    if (import.meta.env.VITE_ARTISTREADY_LOCAL_POSTGRES !== '1' || !value.role) { setCatalog(null); return; }
    const controller = new AbortController();
    setCatalog(null);
    fetch(`/api/local/craft-roles?craft=${encodeURIComponent(value.role)}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Catalog unavailable'); return response.json(); })
      .then((rows: unknown) => { if (Array.isArray(rows) && rows.every(row => typeof row === 'string')) setCatalog(rows); })
      .catch(() => {});
    return () => controller.abort();
  }, [value.role]);
  const options = catalog ?? rolesForCraft(value.role);
  const selected = Array.isArray(value.castingRoles) ? value.castingRoles : [];
  const shown = options.filter(role => role.toLowerCase().includes(query.trim().toLowerCase()));
  return <fieldset className="craft-role-fields"><legend>Roles you want to be considered for <small className="optional">Optional</small></legend>
    <p className="ob-field-note">Choose the {value.role || 'craft'} roles that suit you. You can select several.</p>
    {value.role ? <><label>Find a role<input type="search" value={query} maxLength={80} placeholder="Search roles" onChange={event => setQuery(event.target.value)}/></label>
      <div className="ob-chips" aria-label={`${value.role} role options`}>{shown.map(role => <button key={role} type="button" aria-pressed={selected.includes(role)} onClick={() => onChange({ ...value, castingRoles: selected.includes(role) ? selected.filter(item => item !== role) : [...selected, role] })}>{selected.includes(role) ? <Check size={14}/> : <Plus size={14}/>} {role}</button>)}</div>
      {!shown.length && <p className="ob-field-note">No matching roles. Try another search.</p>}
      <p className="ob-field-note" role="status">{selected.length} roles selected{catalog ? ' · Choices loaded from local PostgreSQL' : ''}</p></> : <p className="ob-field-note">Choose your craft above to see matching roles.</p>}
  </fieldset>;
}
