import type * as React from 'react'
import { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'

import { getActiveBrandModule } from '../../brands/active'
import {
  allBuiltinSections,
  brandGalleryToHomepageImages,
  emptyHomepageConfig,
  resolveGalleryImages,
} from '../../data/homepageConfig'
import type {
  HomepageBuiltinSectionKey,
  HomepageConfig,
  HomepageCustomSection,
  HomepageImage,
} from '../../data/schemas'
import { useLocale } from '../../i18n'
import type { SaveState } from './AdminSettingsPage'

export type AdminHomepagePageProps = {
  config: HomepageConfig | undefined
  isLoading: boolean
  isError: boolean
  save: SaveState
  onSave: (config: HomepageConfig) => void
  onUploadImage: (file: File) => Promise<string>
  onBackClick: () => void
}

const sectionLabelKey: Record<
  HomepageBuiltinSectionKey,
  | 'admin.homepageSectionHero'
  | 'admin.homepageSectionServices'
  | 'admin.homepageSectionStyles'
  | 'admin.homepageSectionStylists'
  | 'admin.homepageSectionVisit'
> = {
  hero: 'admin.homepageSectionHero',
  services: 'admin.homepageSectionServices',
  styles: 'admin.homepageSectionStyles',
  stylists: 'admin.homepageSectionStylists',
  visit: 'admin.homepageSectionVisit',
}

type HomepageEditorProps = {
  initial: HomepageConfig
  save: SaveState
  onSave: (config: HomepageConfig) => void
  onUploadImage: (file: File) => Promise<string>
}

const HomepageEditor: React.FunctionComponent<HomepageEditorProps> = ({
  initial,
  save,
  onSave,
  onUploadImage,
}) => {
  const { t } = useLocale()
  const activeBrand = getActiveBrandModule().profile
  const [hiddenSections, setHiddenSections] = useState<HomepageBuiltinSectionKey[]>(
    initial.hiddenSections,
  )
  const [galleryImages, setGalleryImages] = useState<HomepageImage[]>(() =>
    resolveGalleryImages(initial, activeBrand.gallery),
  )
  const [customSections, setCustomSections] = useState<HomepageCustomSection[]>(
    initial.customSections,
  )
  const [dirty, setDirty] = useState(false)

  // Add image form state
  const [imageUrl, setImageUrl] = useState('')
  const [altDe, setAltDe] = useState('')
  const [altIt, setAltIt] = useState('')
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const galleryFileRef = useRef<HTMLInputElement | null>(null)

  // Add custom section form state
  const [secTitleDe, setSecTitleDe] = useState('')
  const [secTitleIt, setSecTitleIt] = useState('')
  const [secBodyDe, setSecBodyDe] = useState('')
  const [secBodyIt, setSecBodyIt] = useState('')
  const [secImageUrl, setSecImageUrl] = useState('')
  const [uploadingSection, setUploadingSection] = useState(false)
  const [secError, setSecError] = useState<string | null>(null)
  const sectionFileRef = useRef<HTMLInputElement | null>(null)

  const toggleSection = (key: HomepageBuiltinSectionKey) => {
    setHiddenSections((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
    setDirty(true)
  }

  const handleGalleryFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingGallery(true)
    setUploadError(null)
    try {
      const url = await onUploadImage(file)
      setGalleryImages((current) => [
        ...current,
        {
          id: `img-${Date.now()}`,
          src: url,
          altDe: altDe.trim() || file.name,
          altIt: altIt.trim() || altDe.trim() || file.name,
        },
      ])
      setAltDe('')
      setAltIt('')
      setDirty(true)
    } catch (error: unknown) {
      setUploadError(error instanceof Error ? error.message : String(error))
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleAddImageUrl = () => {
    const trimmed = imageUrl.trim()
    if (!trimmed) return
    setGalleryImages((current) => [
      ...current,
      {
        id: `img-${Date.now()}`,
        src: trimmed,
        altDe: altDe.trim(),
        altIt: altIt.trim() || altDe.trim(),
      },
    ])
    setImageUrl('')
    setAltDe('')
    setAltIt('')
    setDirty(true)
  }

  const handleSectionFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingSection(true)
    setSecError(null)
    try {
      const url = await onUploadImage(file)
      setSecImageUrl(url)
    } catch (error: unknown) {
      setSecError(error instanceof Error ? error.message : String(error))
    } finally {
      setUploadingSection(false)
    }
  }

  const handleAddSection = () => {
    const titleDe = secTitleDe.trim()
    const titleIt = secTitleIt.trim() || titleDe
    if (!titleDe) {
      setSecError(t('admin.requiredError'))
      return
    }
    setSecError(null)
    setCustomSections((current) => [
      ...current,
      {
        id: `sec-${Date.now()}`,
        titleDe,
        titleIt,
        bodyDe: secBodyDe.trim(),
        bodyIt: secBodyIt.trim() || secBodyDe.trim(),
        ...(secImageUrl.trim() ? { imageUrl: secImageUrl.trim() } : {}),
      },
    ])
    setSecTitleDe('')
    setSecTitleIt('')
    setSecBodyDe('')
    setSecBodyIt('')
    setSecImageUrl('')
    setDirty(true)
  }

  const submitSave = () => {
    setDirty(false)
    onSave({
      hiddenSections,
      galleryImages,
      customSections,
    })
  }

  return (
    <Stack spacing={3}>
      {/* Built-in sections visibility */}
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          {t('admin.homepageSectionsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('admin.homepageSectionsHint')}
        </Typography>
        <Stack spacing={0.5}>
          {allBuiltinSections.map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={!hiddenSections.includes(key)}
                  onChange={() => toggleSection(key)}
                />
              }
              label={t(sectionLabelKey[key])}
            />
          ))}
        </Stack>
      </Paper>

      {/* Gallery / Styles pictures */}
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h2" sx={{ mb: 0.5 }}>
              {t('admin.homepageGalleryTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.homepageGalleryHint')}
            </Typography>
          </Box>
          {activeBrand.gallery.length > 0 ? (
            <Button
              size="small"
              onClick={() => {
                setGalleryImages(brandGalleryToHomepageImages(activeBrand.gallery))
                setDirty(true)
              }}
            >
              {t('admin.homepageResetGallery')}
            </Button>
          ) : null}
        </Box>

        {galleryImages.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 1.5,
              mb: 3,
            }}
          >
            {galleryImages.map((img) => (
              <Box
                key={img.id}
                sx={{
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                  aspectRatio: '3 / 4',
                }}
              >
                <Box
                  component="img"
                  src={img.src}
                  alt={img.altDe || img.altIt}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <IconButton
                  size="small"
                  aria-label={t('admin.homepageRemoveImage')}
                  onClick={() => {
                    setGalleryImages((current) => current.filter((item) => item.id !== img.id))
                    setDirty(true)
                  }}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: '#FFFFFF' },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : null}

        <Stack spacing={2} sx={{ maxWidth: 520 }}>
          <input
            ref={galleryFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              void handleGalleryFile(event)
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label={t('admin.homepageImageAltDe')}
              value={altDe}
              onChange={(event) => setAltDe(event.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label={t('admin.homepageImageAltIt')}
              value={altIt}
              onChange={(event) => setAltIt(event.target.value)}
              size="small"
              fullWidth
            />
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: 'stretch' }}
          >
            <Button
              variant="outlined"
              startIcon={<UploadFileOutlinedIcon />}
              disabled={uploadingGallery}
              onClick={() => galleryFileRef.current?.click()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {uploadingGallery ? t('admin.homepageUploading') : t('admin.homepageUploadImage')}
            </Button>
            <TextField
              label={t('admin.homepageImageUrl')}
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              size="small"
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!imageUrl.trim()}
              onClick={handleAddImageUrl}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('admin.homepageAddImage')}
            </Button>
          </Stack>
          {uploadError ? <Alert severity="error">{uploadError}</Alert> : null}
        </Stack>
      </Paper>

      {/* Custom sections */}
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          {t('admin.homepageCustomSectionsTitle')}
        </Typography>

        {customSections.length > 0 ? (
          <Stack spacing={2} sx={{ mb: 3 }}>
            {customSections.map((section) => (
              <Box
                key={section.id}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {section.titleDe} / {section.titleIt}
                  </Typography>
                  {section.bodyDe ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {section.bodyDe}
                    </Typography>
                  ) : null}
                  {section.imageUrl ? (
                    <Box
                      component="img"
                      src={section.imageUrl}
                      alt=""
                      sx={{ mt: 1, maxHeight: 80, borderRadius: 1, display: 'block' }}
                    />
                  ) : null}
                </Box>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => {
                    setCustomSections((current) => current.filter((item) => item.id !== section.id))
                    setDirty(true)
                  }}
                >
                  {t('admin.homepageRemoveSection')}
                </Button>
              </Box>
            ))}
          </Stack>
        ) : null}

        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label={t('admin.homepageSectionTitleDe')}
              value={secTitleDe}
              onChange={(event) => setSecTitleDe(event.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label={t('admin.homepageSectionTitleIt')}
              value={secTitleIt}
              onChange={(event) => setSecTitleIt(event.target.value)}
              size="small"
              fullWidth
            />
          </Stack>
          <TextField
            label={t('admin.homepageSectionBodyDe')}
            value={secBodyDe}
            onChange={(event) => setSecBodyDe(event.target.value)}
            multiline
            minRows={2}
            size="small"
            fullWidth
          />
          <TextField
            label={t('admin.homepageSectionBodyIt')}
            value={secBodyIt}
            onChange={(event) => setSecBodyIt(event.target.value)}
            multiline
            minRows={2}
            size="small"
            fullWidth
          />
          <input
            ref={sectionFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              void handleSectionFile(event)
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<UploadFileOutlinedIcon />}
              disabled={uploadingSection}
              onClick={() => sectionFileRef.current?.click()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {uploadingSection ? t('admin.homepageUploading') : t('admin.homepageUploadImage')}
            </Button>
            <TextField
              label={t('admin.homepageSectionImage')}
              value={secImageUrl}
              onChange={(event) => setSecImageUrl(event.target.value)}
              size="small"
              fullWidth
            />
          </Stack>
          {secError ? <Alert severity="error">{secError}</Alert> : null}
          <Box>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddSection}>
              {t('admin.homepageAddSection')}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button variant="contained" disabled={save.saving} onClick={submitSave}>
          {save.saving ? t('admin.saving') : t('admin.save')}
        </Button>
        {save.error ? (
          <Alert severity="error">{t('admin.saveFailed', { message: save.error })}</Alert>
        ) : null}
        {save.saved && !dirty ? (
          <Typography role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
            {t('admin.saved')}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  )
}

export const AdminHomepagePage: React.FunctionComponent<AdminHomepagePageProps> = ({
  config,
  isLoading,
  isError,
  save,
  onSave,
  onUploadImage,
  onBackClick,
}) => {
  const { t } = useLocale()

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
        <Box sx={{ maxWidth: '42rem' }}>
          <Typography variant="h1">{t('admin.homepage')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t('admin.homepageSubtitle')}
          </Typography>
        </Box>
        <Button onClick={onBackClick}>{t('admin.backToSettings')}</Button>
      </Box>

      {isLoading ? <CircularProgress aria-label={t('admin.loading')} /> : null}
      {isError ? <Alert severity="error">{t('admin.settingsError')}</Alert> : null}

      {config !== undefined ? (
        <HomepageEditor
          key={JSON.stringify(config ?? emptyHomepageConfig)}
          initial={config ?? emptyHomepageConfig}
          save={save}
          onSave={onSave}
          onUploadImage={onUploadImage}
        />
      ) : null}
    </Stack>
  )
}
