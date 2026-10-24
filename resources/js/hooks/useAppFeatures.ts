import { usePage } from '@inertiajs/react';

type AuthWithAdmin = {
    canAccessAdminMenu?: boolean;
};

/**
 * Enquanto estas chaves estiverem na lista desativada da igreja, somem para
 * todo mundo no app — inclusive quem tem menu do painel. Religar em
 * Funcionalidades do app devolve o atalho.
 */
const HIDDEN_FOR_EVERYONE_WHEN_DISABLED = ['health'];

function featureIsEnabled(key: string, disabled: string[], canAccessAdminMenu: boolean): boolean {
    if (HIDDEN_FOR_EVERYONE_WHEN_DISABLED.includes(key) && disabled.includes(key)) {
        return false;
    }

    if (canAccessAdminMenu) {
        return true;
    }

    return !disabled.includes(key);
}

/**
 * Funcionalidades do app desativadas para membros (por igreja).
 * Admins com menu do painel veem o restante na UI e podem aceder às rotas.
 */
export function useAppFeatures() {
    const page = usePage();
    const disabled =
        (page.props as { disabledAppFeatures?: string[] }).disabledAppFeatures ?? [];
    const canAccessAdminMenu =
        (page.props.auth as AuthWithAdmin | undefined)?.canAccessAdminMenu === true;

    const isEnabled = (key: string): boolean => featureIsEnabled(key, disabled, canAccessAdminMenu);

    return { isEnabled, disabledKeys: disabled };
}

export function isAppFeatureEnabledFromProps(
    props: { disabledAppFeatures?: string[]; auth?: AuthWithAdmin },
    key: string,
): boolean {
    return featureIsEnabled(key, props.disabledAppFeatures ?? [], props.auth?.canAccessAdminMenu === true);
}
