import { BrainCircuit, CheckCircle2, EyeOff, ExternalLink, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useSettings, useUpdateSettings } from '../../api/hooks';
import { usePageTitle } from '../../components/shell/pageTitle';
import { Alert, ErrorState } from '../../components/ui/Alert';
import { LoadingRegion, Skeleton } from '../../components/ui/Skeleton';
import { Switch } from '../../components/ui/Switch';
import { useToast } from '../../components/ui/toastContext';
import { useI18n } from '../../i18n/context';
import { describeError } from '../../lib/errors';
import './SettingsPage.css';

export const PRIVACY_DOCS_URL = 'https://github.com/jacidProgrammer/HRWebApp#privacy-and-gdpr';

export default function SettingsPage() {
  const { t } = useI18n();
  const toast = useToast();
  usePageTitle(t('settings.title'));
  const settings = useSettings();
  const update = useUpdateSettings();

  const toggle = (enabled: boolean) =>
    update.mutate(enabled, {
      onSuccess: (saved) =>
        toast.show({ title: saved.sentimentAnalysisEnabled ? t('settings.ai.turnedOn') : t('settings.ai.turnedOff') }),
    });

  return (
    <div className="page settings">
      <p className="page-intro__text">{t('settings.intro')}</p>

      <section className="card" aria-labelledby="ai-heading">
        <div className="settings-row">
          <span className="settings-row__icon" aria-hidden="true">
            <BrainCircuit size={20} />
          </span>
          <div className="settings-row__text">
            <h2 id="ai-heading" className="settings-row__title">
              {t('settings.ai.title')}
            </h2>
            <p id="ai-description" className="settings-row__description">
              {t('settings.ai.description')}
            </p>
          </div>
          {settings.isPending ? (
            <Skeleton width={40} height={24} radius={12} />
          ) : settings.data ? (
            <Switch
              checked={settings.data.sentimentAnalysisEnabled}
              onChange={toggle}
              labelledBy="ai-heading"
              describedBy="ai-description"
              disabled={update.isPending}
            />
          ) : null}
        </div>

        <div className="card__body settings__status">
          {settings.isPending ? (
            <LoadingRegion>
              <Skeleton height={48} radius={8} />
            </LoadingRegion>
          ) : settings.isError ? (
            <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
          ) : (
            <dl className="status-grid">
              <div className="status-grid__item">
                <dt>{t('settings.status.state')}</dt>
                <dd>
                  {settings.data.sentimentAnalysisEnabled ? (
                    <span className="badge badge--success">{t('settings.status.on')}</span>
                  ) : (
                    <span className="badge">{t('settings.status.off')}</span>
                  )}
                </dd>
              </div>
              <div className="status-grid__item">
                <dt>{t('settings.status.model')}</dt>
                <dd>
                  {settings.data.sentimentAnalysisAvailable ? (
                    <span className="status-inline status-inline--ok">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {t('settings.status.available')}
                    </span>
                  ) : (
                    <span className="status-inline status-inline--warn">
                      <TriangleAlert size={16} aria-hidden="true" />
                      {t('settings.status.unavailable')}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          )}
          {settings.data && settings.data.sentimentAnalysisEnabled && !settings.data.sentimentAnalysisAvailable && (
            <Alert tone="warning" title={t('settings.unavailable.title')}>
              {t('settings.unavailable.body')}
            </Alert>
          )}
          {update.isError && (
            <Alert tone="danger" title={describeError(update.error, t).title} live>
              {describeError(update.error, t).message}
            </Alert>
          )}
        </div>
      </section>

      <section className="card" aria-labelledby="privacy-heading">
        <div className="card__header">
          <div>
            <h2 id="privacy-heading" className="card__title">
              {t('settings.privacy.title')}
            </h2>
            <p className="card__subtitle">{t('settings.privacy.subtitle')}</p>
          </div>
        </div>
        <ul className="card__body privacy-list">
          <li>
            <span className="privacy-list__icon" aria-hidden="true"><BrainCircuit size={18} /></span>
            <div>
              <p className="privacy-list__title">{t('settings.privacy.analysis.title')}</p>
              <p className="privacy-list__body">{t('settings.privacy.analysis.body')}</p>
            </div>
          </li>
          <li>
            <span className="privacy-list__icon" aria-hidden="true"><EyeOff size={18} /></span>
            <div>
              <p className="privacy-list__title">{t('settings.privacy.anonymous.title')}</p>
              <p className="privacy-list__body">{t('settings.privacy.anonymous.body')}</p>
            </div>
          </li>
          <li>
            <span className="privacy-list__icon" aria-hidden="true"><ShieldCheck size={18} /></span>
            <div>
              <p className="privacy-list__title">{t('settings.privacy.alerts.title')}</p>
              <p className="privacy-list__body">{t('settings.privacy.alerts.body')}</p>
            </div>
          </li>
          <li>
            <span className="privacy-list__icon" aria-hidden="true"><Lock size={18} /></span>
            <div>
              <p className="privacy-list__title">{t('settings.privacy.salary.title')}</p>
              <p className="privacy-list__body">{t('settings.privacy.salary.body')}</p>
            </div>
          </li>
        </ul>
        <div className="settings__more">
          <a href={PRIVACY_DOCS_URL} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            {t('settings.privacy.more')}
            <ExternalLink size={14} aria-hidden="true" />
            <span className="visually-hidden">{t('common.newTab')}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
