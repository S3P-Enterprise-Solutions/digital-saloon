import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

import { fieldIssueMessages } from '../../components/fieldIssueMessages'
import {
  bilingualServiceName,
  emptyServiceFormInput,
  formatServiceDurationRange,
  nextServiceSortOrder,
  serviceFormInputOf,
  sortServicesByOrder,
  validateServiceForm,
  type ServiceDraft,
  type ServiceFormDraft,
  type ServiceFormField,
  type ServiceFormInput,
} from '../../data/serviceForm'
import type { ServiceWithId } from '../../data/services'
import { useLocale } from '../../i18n'
import { ServiceEditor, ServiceList, ServiceRow } from './AdminServicesPage.styles'

export type AdminServicesPageProps = {
  services: ServiceWithId[] | undefined
  isLoading: boolean
  isError: boolean
  saving: boolean
  moving: boolean
  /**
   * Creates (`serviceId: null`) or updates a service and resolves with its id;
   * rejects with an Error on failure.
   */
  onSave: (serviceId: string | null, draft: ServiceDraft) => Promise<string>
  onMove: (serviceId: string, direction: 'up' | 'down') => Promise<void>
  onBackClick: () => void
}

type EditorTarget = { kind: 'new' } | { kind: 'edit'; serviceId: string }

type ServiceEditorFormProps = {
  title: string
  initial: ServiceFormInput
  saving: boolean
  onSave: (draft: ServiceFormDraft) => Promise<void>
  onCancel: () => void
}

const ServiceEditorForm: React.FunctionComponent<ServiceEditorFormProps> = ({
  title,
  initial,
  saving,
  onSave,
  onCancel,
}) => {
  const { t } = useLocale()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<ServiceFormField, string>>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  const update = (field: Exclude<keyof ServiceFormInput, 'active'>, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  return (
    <ServiceEditor
      aria-label={title}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const result = validateServiceForm(values)
        if (!result.ok) {
          setErrors(fieldIssueMessages(t, result.issues))
          return
        }
        setErrors({})
        setSaveError(null)
        onSave(result.value).catch((error: unknown) => {
          setSaveError(error instanceof Error ? error.message : String(error))
        })
      }}
    >
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
        {title}
      </Typography>
      <TextField
        label={t('admin.fieldNameDe')}
        value={values.nameDe}
        onChange={(event) => update('nameDe', event.target.value)}
        error={Boolean(errors.nameDe)}
        helperText={errors.nameDe}
        required
        fullWidth
        autoFocus
      />
      <TextField
        label={t('admin.fieldNameIt')}
        value={values.nameIt}
        onChange={(event) => update('nameIt', event.target.value)}
        error={Boolean(errors.nameIt)}
        helperText={errors.nameIt}
        required
        fullWidth
      />
      <TextField
        label={t('admin.fieldDescriptionDe')}
        value={values.descriptionDe}
        onChange={(event) => update('descriptionDe', event.target.value)}
        error={Boolean(errors.descriptionDe)}
        helperText={errors.descriptionDe ?? t('admin.fieldDescriptionHint')}
        multiline
        minRows={2}
        fullWidth
      />
      <TextField
        label={t('admin.fieldDescriptionIt')}
        value={values.descriptionIt}
        onChange={(event) => update('descriptionIt', event.target.value)}
        error={Boolean(errors.descriptionIt)}
        helperText={errors.descriptionIt}
        multiline
        minRows={2}
        fullWidth
      />
      <div className="editor-numbers">
        <TextField
          label={t('admin.durationFrom')}
          value={values.duration}
          onChange={(event) => update('duration', event.target.value)}
          error={Boolean(errors.duration)}
          helperText={errors.duration ?? t('admin.fieldDurationHint')}
          slotProps={{
            htmlInput: { inputMode: 'numeric' },
            input: {
              endAdornment: (
                <InputAdornment position="end">{t('admin.unitMinutes')}</InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label={t('admin.durationTo')}
          value={values.durationMax}
          onChange={(event) => update('durationMax', event.target.value)}
          error={Boolean(errors.durationMax)}
          helperText={errors.durationMax}
          slotProps={{
            htmlInput: { inputMode: 'numeric' },
            input: {
              endAdornment: (
                <InputAdornment position="end">{t('admin.unitMinutes')}</InputAdornment>
              ),
            },
          }}
        />
      </div>
      <div className="editor-numbers">
        <TextField
          label={t('admin.priceFrom')}
          value={values.price}
          onChange={(event) => update('price', event.target.value)}
          error={Boolean(errors.price)}
          helperText={errors.price}
          slotProps={{
            htmlInput: { inputMode: 'decimal' },
            input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
          }}
        />
        <TextField
          label={t('admin.priceTo')}
          value={values.priceMax}
          onChange={(event) => update('priceMax', event.target.value)}
          error={Boolean(errors.priceMax)}
          helperText={errors.priceMax}
          slotProps={{
            htmlInput: { inputMode: 'decimal' },
            input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
          }}
        />
      </div>
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={values.active}
              onChange={(event) =>
                setValues((current) => ({ ...current, active: event.target.checked }))
              }
            />
          }
          label={t('admin.fieldActive')}
        />
        <FormHelperText sx={{ mt: 0 }}>{t('admin.fieldActiveHint')}</FormHelperText>
      </Box>
      {saveError ? (
        <Alert severity="error">{t('admin.saveFailed', { message: saveError })}</Alert>
      ) : null}
      <Stack direction="row" spacing={1.5}>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? t('admin.saving') : t('admin.save')}
        </Button>
        <Button type="button" onClick={onCancel} disabled={saving}>
          {t('admin.cancelEdit')}
        </Button>
      </Stack>
    </ServiceEditor>
  )
}

export const AdminServicesPage: React.FunctionComponent<AdminServicesPageProps> = ({
  services,
  isLoading,
  isError,
  saving,
  moving,
  onSave,
  onMove,
  onBackClick,
}) => {
  const { t, locale, intlLocale } = useLocale()
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const [savedServiceId, setSavedServiceId] = useState<string | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  const sorted = services ? sortServicesByOrder(services) : undefined

  const formatPrice = (cents: number): string =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100)

  const formatPriceRange = (minCents: number, maxCents?: number): string =>
    maxCents !== undefined && maxCents > minCents
      ? `${formatPrice(minCents)}–${formatPrice(maxCents)}`
      : formatPrice(minCents)

  const save = async (serviceId: string | null, draft: ServiceFormDraft): Promise<void> => {
    const sortOrder =
      serviceId === null
        ? nextServiceSortOrder(services ?? [])
        : (services?.find((service) => service.id === serviceId)?.sortOrder ??
          nextServiceSortOrder(services ?? []))
    const savedId = await onSave(serviceId, { ...draft, sortOrder })
    setEditor(null)
    setSavedServiceId(savedId)
  }

  const move = (serviceId: string, direction: 'up' | 'down') => {
    setMoveError(null)
    onMove(serviceId, direction).catch((error: unknown) => {
      setMoveError(error instanceof Error ? error.message : String(error))
    })
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ maxWidth: '40rem' }}>
          <Button onClick={onBackClick} sx={{ ml: -1, mb: 1 }}>
            {t('admin.backToSettings')}
          </Button>
          <Typography variant="h1">{t('admin.services')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t('admin.servicesSubtitle')} {t('admin.servicesKeepHint')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={editor?.kind === 'new'}
          onClick={() => {
            setSavedServiceId(null)
            setEditor({ kind: 'new' })
          }}
        >
          {t('admin.newService')}
        </Button>
      </Box>

      {isLoading ? <CircularProgress aria-label={t('admin.servicesLoading')} /> : null}
      {isError ? <Alert severity="error">{t('admin.servicesError')}</Alert> : null}
      {moveError ? (
        <Alert severity="error">{t('admin.saveFailed', { message: moveError })}</Alert>
      ) : null}

      {editor?.kind === 'new' ? (
        <ServiceEditorForm
          title={t('admin.newService')}
          initial={emptyServiceFormInput}
          saving={saving}
          onSave={(draft) => save(null, draft)}
          onCancel={() => setEditor(null)}
        />
      ) : null}

      {sorted && sorted.length === 0 && editor === null ? (
        <Typography color="text.secondary">{t('admin.noServices')}</Typography>
      ) : null}

      {sorted && sorted.length > 0 ? (
        <ServiceList aria-label={t('admin.services')}>
          {sorted.map((service, index) => {
            const editing = editor?.kind === 'edit' && editor.serviceId === service.id
            const busy = saving || moving || editing
            return (
              <li key={service.id}>
                <ServiceRow className={service.active ? undefined : 'is-inactive'}>
                  <div className="service-reorder">
                    <IconButton
                      size="small"
                      aria-label={t('admin.moveServiceUp', {
                        name: bilingualServiceName(service),
                      })}
                      disabled={busy || index === 0}
                      onClick={() => move(service.id, 'up')}
                    >
                      <KeyboardArrowUpIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label={t('admin.moveServiceDown', {
                        name: bilingualServiceName(service),
                      })}
                      disabled={busy || index === sorted.length - 1}
                      onClick={() => move(service.id, 'down')}
                    >
                      <KeyboardArrowDownIcon fontSize="small" />
                    </IconButton>
                  </div>
                  <div className="service-text">
                    <span className="service-name">{bilingualServiceName(service)}</span>
                    {service.active ? null : (
                      <span className="service-inactive">{t('admin.inactiveTag')}</span>
                    )}
                    {(locale === 'it' ? service.descriptionIt : service.descriptionDe) ? (
                      <div className="service-description">
                        {locale === 'it' ? service.descriptionIt : service.descriptionDe}
                      </div>
                    ) : null}
                  </div>
                  <span className="service-duration">
                    {t('admin.minutes', {
                      minutes: formatServiceDurationRange(
                        service.durationMinutes,
                        service.durationMaxMinutes,
                      ),
                    })}
                  </span>
                  <span className="service-price">
                    {formatPriceRange(service.priceCents, service.priceMaxCents)}
                  </span>
                  <Button
                    className="service-edit"
                    size="small"
                    aria-label={t('admin.editServiceLabel', {
                      name: bilingualServiceName(service),
                    })}
                    disabled={editing || moving}
                    onClick={() => {
                      setSavedServiceId(null)
                      setEditor({ kind: 'edit', serviceId: service.id })
                    }}
                  >
                    {t('admin.edit')}
                  </Button>
                </ServiceRow>
                {savedServiceId === service.id ? (
                  <Typography
                    role="status"
                    sx={{ color: 'success.main', fontWeight: 600, mt: -1, mb: 1.5 }}
                  >
                    {t('admin.saved')}
                  </Typography>
                ) : null}
                {editing ? (
                  <ServiceEditorForm
                    title={t('admin.editServiceTitle')}
                    initial={serviceFormInputOf(service)}
                    saving={saving}
                    onSave={(draft) => save(service.id, draft)}
                    onCancel={() => setEditor(null)}
                  />
                ) : null}
              </li>
            )
          })}
        </ServiceList>
      ) : null}
    </Stack>
  )
}
