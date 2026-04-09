'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { listBusinessProfilesForUser } from '@/lib/business';
import { hasPermission, type BusinessMemberRole } from '@/lib/business-access';
import AuthModal from '@/components/AuthModal';
import { IconX } from '@/components/Icons';
import { useToast } from '@/hooks/useToast';

type TeamMember = {
    id: string;
    user_id: string;
    role: BusinessMemberRole;
    status: string;
    email: string | null;
};

type Invitation = {
    id: string;
    email: string;
    role: BusinessMemberRole;
    expires_at: string;
};

type AuditItem = {
    id: string;
    actor_user_id: string | null;
    action: string;
    target_user_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Solo lectura',
};

const ACTION_LABELS: Record<string, string> = {
    member_added: 'Miembro agregado',
    member_removed: 'Miembro eliminado',
    role_changed: 'Rol cambiado',
    member_status_changed: 'Estado del miembro',
    invite_created: 'Invitación creada',
    invite_status_changed: 'Invitación actualizada',
    invite_deleted: 'Invitación eliminada',
    owner_transferred: 'Propiedad transferida',
};

function EquipoPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { success, error: toastError } = useToast();

    const [loading, setLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(searchParams.get('business'));
    const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
    const [yourRole, setYourRole] = useState<BusinessMemberRole | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
    const [saving, setSaving] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState('');

    const loadBusinesses = useCallback(async () => {
        if (!user) return;
        const list = await listBusinessProfilesForUser(user.id);
        setOptions(list.map((m) => ({ id: m.profile.id, name: m.profile.name || m.profile.slug })));
        const param = searchParams.get('business');
        const pick =
            (param && list.find((l) => l.profile.id === param)?.profile.id) || list[0]?.profile.id || null;
        setBusinessId(pick);
        const m = list.find((l) => l.profile.id === pick);
        setYourRole(m?.role ?? null);
    }, [user, searchParams]);

    const fetchTeam = useCallback(async () => {
        if (!user || !businessId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/business/${businessId}/team`, { credentials: 'include' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error');
            setMembers(json.members || []);
            setInvitations(json.invitations || []);
            if (json.yourRole) setYourRole(json.yourRole);
        } catch (e: any) {
            toastError(e.message || 'Error al cargar el equipo');
        } finally {
            setLoading(false);
        }
    }, [user, businessId, toastError]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setShowAuth(true);
            return;
        }
        loadBusinesses();
    }, [authLoading, user, loadBusinesses]);

    useEffect(() => {
        if (!user || !businessId) return;
        fetchTeam();
    }, [user, businessId, fetchTeam]);

    const fetchAudit = useCallback(async () => {
        if (!businessId || (yourRole !== 'owner' && yourRole !== 'admin')) return;
        setAuditLoading(true);
        try {
            const res = await fetch(`/api/business/${businessId}/audit?limit=40`, {
                credentials: 'include',
            });
            const json = await res.json();
            if (res.ok) setAuditItems(json.items || []);
        } catch {
            setAuditItems([]);
        } finally {
            setAuditLoading(false);
        }
    }, [businessId, yourRole]);

    useEffect(() => {
        if (loading || !businessId) return;
        if (yourRole !== 'owner' && yourRole !== 'admin') {
            setAuditItems([]);
            return;
        }
        fetchAudit();
    }, [loading, businessId, yourRole, fetchAudit]);

    const canInvite = yourRole && hasPermission(yourRole, 'team:invite');
    const canManageRoles = yourRole && hasPermission(yourRole, 'team:change_role');
    const canRemove = yourRole && hasPermission(yourRole, 'team:remove');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId || !inviteEmail.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/invite`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error');
            success(json.emailWarning ? 'Invitación creada (revisa configuración de correo)' : 'Invitación enviada');
            if (json.acceptUrl && process.env.NODE_ENV === 'development') {
                console.info('Dev invitation link:', json.acceptUrl);
            }
            setInviteEmail('');
            await fetchTeam();
            await fetchAudit();
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const cancelInvite = async (id: string) => {
        if (!businessId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/invite?invitationId=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            success('Invitación cancelada');
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const changeRole = async (memberUserId: string, role: 'admin' | 'editor' | 'viewer') => {
        if (!businessId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/members/${memberUserId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            success('Rol actualizado');
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const removeMember = async (memberUserId: string) => {
        if (!businessId || !confirm('¿Quitar a esta persona del equipo?')) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/members/${memberUserId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            success('Miembro eliminado');
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const transferOwnership = async () => {
        if (!businessId || !transferTargetId || yourRole !== 'owner') return;
        if (
            !confirm(
                'Transferirás la propiedad de este negocio. Pasarás a rol Administrador y no podrás deshacer esto desde aquí. ¿Continuar?'
            )
        ) {
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/transfer-owner`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newOwnerUserId: transferTargetId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error');
            success('Propiedad transferida');
            setTransferTargetId('');
            await loadBusinesses();
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <AuthModal abierto={showAuth} onCerrar={() => router.push('/')} modoInicial="login" />
                <div className="min-h-screen flex items-center justify-center text-slate-600">
                    Inicia sesión para gestionar el equipo
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/mi-negocio')}
                            className="p-2 hover:bg-slate-100 rounded-full"
                        >
                            <IconX size={20} color="#64748b" />
                        </button>
                        <h1 className="font-bold text-slate-900">Equipo del negocio</h1>
                    </div>
                    <Link href="/mi-negocio" className="text-sm text-blue-600 font-medium">
                        Editor
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {options.length > 0 && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Negocio</label>
                        <select
                            className="w-full max-w-md border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            value={businessId || ''}
                            onChange={(e) => {
                                const id = e.target.value;
                                setBusinessId(id);
                                router.replace(`/mi-negocio/equipo?business=${id}`);
                            }}
                        >
                            {options.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {loading && (
                    <p className="text-sm text-slate-500">Cargando equipo…</p>
                )}

                {!loading && businessId && (
                    <>
                        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="font-semibold text-slate-900 mb-4">Miembros</h2>
                            <ul className="divide-y divide-slate-100">
                                {members.map((m) => (
                                    <li
                                        key={m.id}
                                        className="py-3 flex flex-wrap items-center justify-between gap-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {m.email || m.user_id.slice(0, 8) + '…'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {ROLE_LABELS[m.role] || m.role}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {m.user_id === user.id && (
                                                <span className="text-xs text-slate-400">Tú</span>
                                            )}
                                            {canManageRoles && m.role !== 'owner' && m.user_id !== user.id && (
                                                <select
                                                    className="text-xs border rounded px-2 py-1"
                                                    value={m.role}
                                                    disabled={saving}
                                                    onChange={(e) =>
                                                        changeRole(
                                                            m.user_id,
                                                            e.target.value as 'admin' | 'editor' | 'viewer'
                                                        )
                                                    }
                                                >
                                                    <option value="admin">Administrador</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="viewer">Solo lectura</option>
                                                </select>
                                            )}
                                            {canRemove && m.role !== 'owner' && m.user_id !== user.id && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-red-600 hover:underline"
                                                    disabled={saving}
                                                    onClick={() => removeMember(m.user_id)}
                                                >
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {invitations.length > 0 && (
                            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h2 className="font-semibold text-slate-900 mb-4">Invitaciones pendientes</h2>
                                <ul className="space-y-2">
                                    {invitations.map((inv) => (
                                        <li
                                            key={inv.id}
                                            className="flex flex-wrap justify-between gap-2 text-sm border border-slate-100 rounded-lg px-3 py-2"
                                        >
                                            <span>
                                                {inv.email}{' '}
                                                <span className="text-slate-500">
                                                    ({ROLE_LABELS[inv.role] || inv.role})
                                                </span>
                                            </span>
                                            {canInvite && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-slate-600 hover:underline"
                                                    disabled={saving}
                                                    onClick={() => cancelInvite(inv.id)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {yourRole === 'owner' && members.length > 0 && (
                            <section className="bg-amber-50 rounded-xl border border-amber-200 p-6 shadow-sm">
                                <h2 className="font-semibold text-amber-950 mb-2">Transferir propiedad</h2>
                                <p className="text-xs text-amber-900/80 mb-3">
                                    El nuevo propietario debe ser miembro del equipo. Tú quedarás como administrador.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                    <select
                                        className="flex-1 border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
                                        value={transferTargetId}
                                        onChange={(e) => setTransferTargetId(e.target.value)}
                                    >
                                        <option value="">Elige un miembro…</option>
                                        {members
                                            .filter((m) => m.user_id !== user.id && m.role !== 'owner')
                                            .map((m) => (
                                                <option key={m.user_id} value={m.user_id}>
                                                    {m.email || m.user_id.slice(0, 8) + '…'} ({ROLE_LABELS[m.role]})
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={saving || !transferTargetId}
                                        onClick={transferOwnership}
                                        className="px-4 py-2 rounded-lg bg-amber-700 text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        Transferir
                                    </button>
                                </div>
                            </section>
                        )}

                        {(yourRole === 'owner' || yourRole === 'admin') && (
                            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-semibold text-slate-900">Registro de actividad</h2>
                                    <button
                                        type="button"
                                        className="text-xs text-blue-600 font-medium"
                                        onClick={() => fetchAudit()}
                                        disabled={auditLoading}
                                    >
                                        Actualizar
                                    </button>
                                </div>
                                {auditLoading && (
                                    <p className="text-xs text-slate-500">Cargando…</p>
                                )}
                                {!auditLoading && auditItems.length === 0 && (
                                    <p className="text-xs text-slate-500">Sin eventos recientes.</p>
                                )}
                                {!auditLoading && auditItems.length > 0 && (
                                    <ul className="space-y-2 max-h-72 overflow-y-auto text-xs">
                                        {auditItems.map((a) => (
                                            <li
                                                key={a.id}
                                                className="border border-slate-100 rounded-lg px-3 py-2 flex flex-col gap-0.5"
                                            >
                                                <span className="font-semibold text-slate-800">
                                                    {ACTION_LABELS[a.action] || a.action}
                                                </span>
                                                <span className="text-slate-500">
                                                    {new Date(a.created_at).toLocaleString()}
                                                </span>
                                                {Object.keys(a.metadata || {}).length > 0 && (
                                                    <span className="text-slate-400 font-mono truncate">
                                                        {JSON.stringify(a.metadata)}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}

                        {canInvite && (
                            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h2 className="font-semibold text-slate-900 mb-4">Invitar por correo</h2>
                                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        required
                                        placeholder="correo@empresa.com"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    <select
                                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        value={inviteRole}
                                        onChange={(e) =>
                                            setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')
                                        }
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Solo lectura</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        Enviar
                                    </button>
                                </form>
                                <p className="text-xs text-slate-500 mt-3">
                                    La persona debe aceptar con una cuenta que use el mismo correo. Los
                                    administradores pueden gestionar miembros; los editores pueden editar el
                                    catálogo y la página; solo lectura puede ver sin cambiar.
                                </p>
                            </section>
                        )}

                        {!canInvite && yourRole && (
                            <p className="text-sm text-slate-600">
                                Tu rol ({ROLE_LABELS[yourRole]}) no permite invitar personas. Pide a un
                                administrador que te suba de rol si necesitas hacerlo.
                            </p>
                        )}
                    </>
                )}

                {!loading && !businessId && options.length === 0 && (
                    <p className="text-slate-600 text-sm">
                        Aún no tienes un negocio.{' '}
                        <Link href="/mi-negocio?new=1" className="text-blue-600 font-medium">
                            Crea uno
                        </Link>
                        .
                    </p>
                )}
            </main>
        </div>
    );
}

export default function EquipoPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <EquipoPageContent />
        </Suspense>
    );
}
