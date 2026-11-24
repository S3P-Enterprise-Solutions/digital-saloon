import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import * as v from 'valibot'

import { firebaseStorage, firestore } from '../firebase'
import type { BrandGalleryItem } from '../brands/types'
import { getSalonId } from './salonConfig'
import { homepageSettingsPath } from './salonPaths'
import {
  homepageConfigSchema,
  type HomepageBuiltinSectionKey,
  type HomepageConfig,
  type HomepageImage,
} from './schemas'

export const emptyHomepageConfig: HomepageConfig = {
  hiddenSections: [],
  customSections: [],
}

export const allBuiltinSections: readonly HomepageBuiltinSectionKey[] = [
  'hero',
  'services',
  'styles',
  'stylists',
  'visit',
]

export function isSectionVisible(
  config: HomepageConfig | undefined,
  section: HomepageBuiltinSectionKey,
): boolean {
  if (!config) return true
  return !config.hiddenSections.includes(section)
}

export function brandGalleryToHomepageImages(
  brandGallery: readonly BrandGalleryItem[],
): HomepageImage[] {
  return brandGallery.map((item, index) => ({
    id: `brand-${index}`,
    src: item.src,
    altDe: item.altDe,
    altIt: item.altIt,
  }))
}

export function resolveGalleryImages(
  config: HomepageConfig | undefined,
  brandGallery: readonly BrandGalleryItem[],
): HomepageImage[] {
  if (config?.galleryImages !== undefined) {
    return config.galleryImages
  }
  return brandGalleryToHomepageImages(brandGallery)
}

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  const snap = await getDoc(doc(firestore, homepageSettingsPath(getSalonId())))
  if (!snap.exists()) return emptyHomepageConfig
  return v.parse(homepageConfigSchema, snap.data())
}

export async function saveHomepageConfig(config: HomepageConfig): Promise<void> {
  const parsed = v.parse(homepageConfigSchema, config)
  const payload: Record<string, unknown> = {
    hiddenSections: parsed.hiddenSections,
    customSections: parsed.customSections.map((section) => ({
      id: section.id,
      titleDe: section.titleDe,
      titleIt: section.titleIt,
      bodyDe: section.bodyDe,
      bodyIt: section.bodyIt,
      ...(section.imageUrl ? { imageUrl: section.imageUrl } : {}),
    })),
    ...(parsed.galleryImages !== undefined ? { galleryImages: parsed.galleryImages } : {}),
  }
  await setDoc(doc(firestore, homepageSettingsPath(getSalonId())), payload)
}

export async function uploadHomepageImage(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image'
  const path = `salons/${getSalonId()}/homepage/${Date.now()}-${safeName}`
  const storageRef = ref(firebaseStorage, path)
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' })
  return getDownloadURL(storageRef)
}
