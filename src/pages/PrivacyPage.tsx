import type * as React from 'react'
import { Paper, Stack, Typography } from '@mui/material'

import type { Salon } from '../data/schemas'
import { useLocale } from '../i18n'
import type { MessageKey } from '../i18n'

export type PrivacyPageProps = {
  /** Controller details; `null` while the salon document is loading or missing. */
  salon: Salon | null
}

type PrivacySection = {
  title: MessageKey
  body: MessageKey
}

const sections: readonly PrivacySection[] = [
  { title: 'privacy.bookingTitle', body: 'privacy.bookingBody' },
  { title: 'privacy.emailTitle', body: 'privacy.emailBody' },
  { title: 'privacy.hostingTitle', body: 'privacy.hostingBody' },
  { title: 'privacy.logsTitle', body: 'privacy.logsBody' },
  { title: 'privacy.storageTitle', body: 'privacy.storageBody' },
  { title: 'privacy.fontsTitle', body: 'privacy.fontsBody' },
  { title: 'privacy.retentionTitle', body: 'privacy.retentionBody' },
  { title: 'privacy.rightsTitle', body: 'privacy.rightsBody' },
  { title: 'privacy.authorityTitle', body: 'privacy.authorityBody' },
]

export const PrivacyPage: React.FunctionComponent<PrivacyPageProps> = ({ salon }) => {
  const { t } = useLocale()

  return (
    <Paper component="article" sx={{ p: { xs: 3, sm: 5 } }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography variant="h1">{t('privacy.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('privacy.updated')}
          </Typography>
        </Stack>
        <Typography>{t('privacy.intro')}</Typography>

        <Stack component="section" spacing={1}>
          <Typography variant="h2" sx={{ fontSize: '1.25rem' }}>
            {t('privacy.controllerTitle')}
          </Typography>
          {salon ? (
            <Typography component="address" sx={{ fontStyle: 'normal' }}>
              {salon.name}
              <br />
              {salon.address}
              <br />
              {t('privacy.controllerContact', { phone: salon.phone, email: salon.email })}
              {salon.vatId ? (
                <>
                  <br />
                  {t('footer.vatId')} {salon.vatId}
                </>
              ) : null}
            </Typography>
          ) : null}
        </Stack>

        {sections.map((section) => (
          <Stack key={section.title} component="section" spacing={1}>
            <Typography variant="h2" sx={{ fontSize: '1.25rem' }}>
              {t(section.title)}
            </Typography>
            {t(section.body)
              .split('\n\n')
              .map((paragraph) => (
                <Typography key={paragraph}>{paragraph}</Typography>
              ))}
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
