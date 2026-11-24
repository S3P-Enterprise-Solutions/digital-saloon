export type Messages = {
  'nav.staffCalendar': string
  'nav.staffPending': string
  'nav.staffSettings': string
  'nav.staffLogin': string
  'nav.signedInAs': string
  'nav.main': string
  'nav.signOut': string
  'nav.language': string
  'nav.book': string
  'nav.home': string
  'app.pullToRefresh': string
  'app.refreshing': string

  'home.place': string
  'home.intro': string
  'home.book': string
  'home.call': string
  'home.servicesTitle': string
  'home.servicesHint': string
  'home.servicesError': string
  'home.servicesEmpty': string
  'home.hoursTitle': string
  'home.hoursError': string
  'home.closed': string
  'home.today': string
  'home.visitTitle': string
  'home.stylistsTitle': string
  'home.stylesTitle': string
  'home.stylesHint': string
  'home.directions': string
  'footer.vatId': string
  'footer.privacy': string
  'privacy.title': string
  'privacy.updated': string
  'privacy.intro': string
  'privacy.controllerTitle': string
  'privacy.controllerContact': string
  'privacy.bookingTitle': string
  'privacy.bookingBody': string
  'privacy.emailTitle': string
  'privacy.emailBody': string
  'privacy.hostingTitle': string
  'privacy.hostingBody': string
  'privacy.storageTitle': string
  'privacy.storageBody': string
  'privacy.fontsTitle': string
  'privacy.fontsBody': string
  'privacy.retentionTitle': string
  'privacy.retentionBody': string
  'privacy.rightsTitle': string
  'privacy.rightsBody': string
  'privacy.authorityTitle': string
  'privacy.authorityBody': string

  'book.title': string
  'book.subtitle': string
  'book.step.service': string
  'book.step.date': string
  'book.step.time': string
  'book.step.details': string
  'book.step.confirm': string
  'book.servicesLoading': string
  'book.servicesError': string
  'book.availabilityLoading': string
  'book.availabilityError': string
  'book.noSlotsMonth': string
  'book.noSlotsDay': string
  'book.monthPrev': string
  'book.monthNext': string
  'book.firstName': string
  'book.lastName': string
  'book.phone': string
  'book.phoneHelp': string
  'book.privacyBefore': string
  'book.privacyLink': string
  'book.privacyAfter': string
  'book.opensInNewTab': string
  'book.error.firstNameRequired': string
  'book.error.firstNameTooLong': string
  'book.error.lastNameRequired': string
  'book.error.lastNameTooLong': string
  'book.error.phoneInvalid': string
  'book.error.emailRequired': string
  'book.error.emailTooLong': string
  'book.error.emailInvalid': string
  'book.error.notesTooLong': string
  'book.error.privacyRequired': string
  'book.error.invalid': string
  'book.error.slotTaken': string
  'book.error.serviceUnavailable': string
  'book.error.submitFailed': string
  'book.submit': string
  'book.submitting': string
  'book.otherTime': string
  'book.durationMinutes': string
  'book.weekday.mo': string
  'book.weekday.tu': string
  'book.weekday.we': string
  'book.weekday.th': string
  'book.weekday.fr': string
  'book.weekday.sa': string
  'book.weekday.su': string
  'book.step1Title': string
  'book.step2Title': string
  'book.continueToDate': string
  'book.backToServices': string
  'book.selectedServicesCount': string
  'book.totalDuration': string
  'book.totalPrice': string
  'book.email': string
  'book.notes': string
  'book.notesPlaceholder': string
  'price.onRequest': string

  'confirmed.pendingTitle': string
  'confirmed.confirmedTitle': string
  'confirmed.pendingBody': string
  'confirmed.confirmedBody': string
  'confirmed.emailSentNote': string
  'confirmed.saveWarning': string
  'confirmed.linkHeading': string
  'confirmed.manage': string
  'confirmed.copy': string
  'confirmed.share': string
  'confirmed.mailto': string
  'confirmed.myBookings': string
  'confirmed.home': string
  'confirmed.copied': string
  'confirmed.shared': string
  'confirmed.shareTitle': string
  'confirmed.shareText': string

  'myBookings.title': string
  'myBookings.subtitle': string
  'myBookings.empty': string
  'myBookings.open': string
  'myBookings.copy': string
  'myBookings.share': string
  'myBookings.mailto': string
  'myBookings.remove': string
  'myBookings.bookNew': string
  'myBookings.home': string
  'myBookings.invalid': string
  'myBookings.status': string
  'myBookings.removed': string
  'myBookings.copied': string
  'myBookings.copyFailed': string
  'myBookings.shared': string
  'myBookings.loading': string
  'myBookings.shareTitle': string
  'myBookings.shareText': string

  'manage.title': string
  'manage.subtitle': string
  'manage.loading': string
  'manage.notFound': string
  'manage.status': string
  'manage.reschedule': string
  'manage.cancelReschedule': string
  'manage.cancel': string
  'manage.cancelling': string
  'manage.immutable': string
  'manage.pickTime': string
  'manage.slotsLoading': string
  'manage.noAlternatives': string
  'manage.home': string
  'manage.actionFailed': string

  'status.PENDING': string
  'status.CONFIRMED': string
  'status.DECLINED': string
  'status.EXPIRED': string
  'status.CANCELLED': string
  'status.COMPLETED': string

  'login.title': string
  'login.email': string
  'login.password': string
  'login.submit': string
  'login.submitting': string
  'login.hint': string
  'login.staffOnly': string
  'login.customerNote': string
  'login.failed': string
  'login.backHome': string

  'employee.title': string
  'employee.loading': string
  'employee.signInRequired': string
  'employee.forbidden': string
  'employee.greeting': string
  'employee.navHours': string
  'employee.navServices': string
  'employee.navBookings': string
  'employee.navPassword': string
  'employee.hoursTitle': string
  'employee.hoursHint': string
  'employee.hoursError': string
  'employee.dayExceptionTitle': string
  'employee.servicesTitle': string
  'employee.servicesHint': string
  'employee.servicesError': string
  'employee.servicesEmpty': string
  'employee.bookingsTitle': string
  'employee.bookingsHint': string
  'employee.bookingsError': string
  'employee.bookingsEmpty': string
  'employee.passwordTitle': string
  'employee.passwordHint': string
  'employee.currentPassword': string
  'employee.newPassword': string
  'employee.confirmPassword': string
  'employee.passwordMismatch': string
  'employee.passwordSaved': string
  'employee.passwordSubmit': string

  'error.somethingWrong': string
  'error.tryAgain': string

  'admin.title': string
  'admin.calendar': string
  'admin.reservations': string
  'admin.time': string
  'admin.timeFreeLabel': string
  'admin.nextFreeSlotHint': string
  'admin.nextFreeSlotTag': string
  'admin.currentSlotKept': string
  'admin.customer': string
  'admin.status': string
  'admin.open': string
  'admin.noReservations': string
  'admin.reservationsError': string
  'admin.services': string
  'admin.service': string
  'admin.settings': string
  'admin.maintenance': string
  'admin.maintenanceHint': string
  'admin.expirePending': string
  'admin.expireResult': string
  'admin.loading': string
  'admin.signInRequired': string
  'admin.forbidden': string
  'admin.today': string
  'admin.calendarLoading': string
  'admin.detailTitle': string
  'admin.backToCalendar': string
  'admin.backToPending': string
  'admin.detailLoading': string
  'admin.notFound': string
  'admin.source': string
  'admin.note': string
  'admin.customerNotes': string
  'admin.confirm': string
  'admin.decline': string
  'admin.complete': string
  'admin.cancel': string
  'admin.quickDetails': string
  'admin.reschedule': string
  'admin.cancelConfirmTitle': string
  'admin.cancelConfirmBody': string
  'admin.cancelConfirmAction': string
  'admin.declineConfirmTitle': string
  'admin.declineConfirmBody': string
  'admin.declineConfirmAction': string
  'admin.dialogDismiss': string
  'admin.editReservationTitle': string
  'admin.editReservationSubtitle': string
  'admin.saveReservation': string
  'admin.manualTitle': string
  'admin.manualSubtitle': string
  'admin.back': string
  'admin.dayLabel': string
  'admin.noSlots': string
  'admin.emailOptional': string
  'admin.noteOptional': string
  'admin.saving': string
  'admin.createReservation': string
  'admin.servicesSubtitle': string
  'admin.servicesLoading': string
  'admin.servicesError': string
  'admin.noServices': string
  'admin.newService': string
  'admin.editServiceLabel': string
  'admin.moveServiceUp': string
  'admin.moveServiceDown': string
  'admin.edit': string
  'admin.editServiceTitle': string
  'admin.servicesKeepHint': string
  'admin.fieldDescription': string
  'admin.fieldDescriptionHint': string
  'admin.fieldDurationHint': string
  'admin.fieldActive': string
  'admin.fieldActiveHint': string
  'admin.inactiveTag': string
  'admin.cancelEdit': string
  'admin.priceError': string
  'admin.name': string
  'admin.fieldNameDe': string
  'admin.fieldNameIt': string
  'admin.fieldDescriptionDe': string
  'admin.fieldDescriptionIt': string
  'admin.duration': string
  'admin.price': string
  'admin.active': string
  'admin.yes': string
  'admin.no': string
  'admin.minutes': string
  'admin.durationFrom': string
  'admin.durationTo': string
  'admin.priceFrom': string
  'admin.priceTo': string
  'admin.homepage': string
  'admin.homepageSubtitle': string
  'admin.homepageEditButton': string
  'admin.homepageSectionsTitle': string
  'admin.homepageSectionsHint': string
  'admin.homepageSectionHero': string
  'admin.homepageSectionServices': string
  'admin.homepageSectionStyles': string
  'admin.homepageSectionStylists': string
  'admin.homepageSectionVisit': string
  'admin.homepageGalleryTitle': string
  'admin.homepageGalleryHint': string
  'admin.homepageUploadImage': string
  'admin.homepageUploading': string
  'admin.homepageImageUrl': string
  'admin.homepageImageAltDe': string
  'admin.homepageImageAltIt': string
  'admin.homepageAddImage': string
  'admin.homepageRemoveImage': string
  'admin.homepageResetGallery': string
  'admin.homepageCustomSectionsTitle': string
  'admin.homepageAddSection': string
  'admin.homepageRemoveSection': string
  'admin.homepageSectionTitleDe': string
  'admin.homepageSectionTitleIt': string
  'admin.homepageSectionBodyDe': string
  'admin.homepageSectionBodyIt': string
  'admin.homepageSectionImage': string
  'home.carouselPrev': string
  'home.carouselNext': string
  'admin.demoModeTitle': string
  'admin.demoModeHint': string
  'admin.demoModeSwitch': string
  'admin.firstAdminTitle': string
  'admin.firstAdminHint': string
  'admin.firstAdminCreated': string
  'admin.firstAdminCreateButton': string
  'admin.firstAdminAlreadyExists': string
  'admin.employeesTitle': string
  'admin.employeesHint': string
  'admin.employeeCreateButton': string
  'admin.employeeCreated': string
  'admin.fieldFirstName': string
  'admin.fieldLastName': string
  'admin.employeesManageTitle': string
  'admin.employeesManageSubtitle': string
  'admin.employeesNavTitle': string
  'admin.employeesNavHint': string
  'admin.employeesAccessButton': string
  'admin.employeesAccessTitle': string
  'admin.employeesCreateAccountTitle': string
  'admin.employeesCreateAccountHint': string
  'admin.employeesLinkAdminTitle': string
  'admin.employeesLinkAdminHint': string
  'admin.employeesLinkAdminPick': string
  'admin.employeesLinkAdminButton': string
  'admin.employeesLinkAdminDone': string
  'admin.employeesNoLinkableAdmins': string
  'admin.employeesListTitle': string
  'admin.employeesLoadError': string
  'admin.employeesListEmpty': string
  'admin.employeesProfileTitle': string
  'admin.employeesProfileHint': string
  'admin.employeesBookableTitle': string
  'admin.employeesBookableHint': string
  'admin.employeesBookableOn': string
  'admin.employeesBookableOff': string
  'admin.employeesBookableAuthBlocked': string
  'admin.employeesAuthTitle': string
  'admin.employeesAuthHint': string
  'admin.employeesAuthManageButton': string
  'admin.employeesAccountTitle': string
  'admin.employeesAccountManageButton': string
  'admin.employeesAuthEnabled': string
  'admin.employeesAuthDisabled': string
  'admin.employeesSetPassword': string
  'admin.employeesServicesTitle': string
  'admin.employeesServiceAssignmentTitle': string
  'admin.employeesServiceAssignmentHint': string
  'admin.employeesServiceAssignmentEmpty': string
  'admin.employeesServiceAssignmentNoEmployees': string
  'admin.employeesHoursTitle': string
  'admin.employeesHoursHint': string
  'admin.employeesDayExceptionTitle': string
  'admin.employeesDayExceptionHint': string
  'admin.employeesDayExceptionDate': string
  'admin.employeesDayExceptionAdd': string
  'admin.employeesDayExceptionEdit': string
  'admin.employeesDayExceptionEmpty': string
  'admin.employeesDayExceptionSave': string
  'admin.employeesDayExceptionDelete': string
  'admin.employeesDayExceptionAllDay': string
  'admin.employeesDayExceptionPartial': string
  'admin.employeesDayExceptionOpenThen': string
  'admin.employeesDayExceptionAbsentThen': string
  'admin.employeesDayExceptionDefaultName': string
  'admin.employeesBookablePreviewTitle': string
  'admin.employeesBookablePreviewHint': string
  'admin.employeesBookablePreviewError': string
  'admin.employeesBookablePreviewEmpty': string
  'admin.employeesBookablePreviewServices': string
  'admin.employeesSoftRemove': string
  'admin.employeesRemoved': string
  'admin.employeesError.firstNameInvalid': string
  'admin.employeesError.lastNameInvalid': string
  'admin.employeesError.emailInvalid': string
  'admin.employeesError.passwordTooShort': string
  'admin.employeesError.alreadyExists': string
  'admin.employeesError.notFound': string
  'admin.employeesError.featureDisabled': string
  'admin.employeesError.authDisabledBookable': string
  'admin.employeesError.mustBeAdmin': string
  'admin.employeesError.failed': string
  'admin.primaryAdminBadge': string
  'admin.accountDisplayName': string
  'admin.accountEmail': string
  'admin.accountPassword': string
  'admin.settingsSubtitle': string
  'admin.settingsLoading': string
  'admin.settingsError': string
  'admin.confirmationMode': string
  'admin.slotInterval': string
  'admin.minAdvance': string
  'admin.maxAdvance': string
  'admin.pendingExpiration': string
  'admin.openingHours': string
  'admin.openingHoursLoading': string
  'admin.openingHoursError': string
  'admin.closed': string

  'hours.title': string
  'hours.subtitle': string
  'hours.weeklyTitle': string
  'hours.weeklyHint': string
  'hours.open': string
  'hours.from': string
  'hours.to': string
  'hours.addInterval': string
  'hours.removeInterval': string
  'hours.copyToOpenDays': string
  'hours.copied': string
  'hours.intervalOrder': string
  'hours.intervalOverlap': string
  'hours.intervalInvalid': string
  'hours.unsaved': string
  'hours.absencesTitle': string
  'hours.absencesHint': string
  'hours.addAbsence': string
  'hours.absencesEmpty': string
  'hours.absencesError': string
  'hours.kindQuestion': string
  'hours.kindDays': string
  'hours.kindDaysHint': string
  'hours.kindMorning': string
  'hours.kindMorningHint': string
  'hours.kindAfternoon': string
  'hours.kindAfternoonHint': string
  'hours.kindCustom': string
  'hours.kindCustomHint': string
  'hours.firstDay': string
  'hours.lastDay': string
  'hours.date': string
  'hours.note': string
  'hours.notePlaceholder': string
  'hours.defaultName': string
  'hours.dayCount': string
  'hours.openThen': string
  'hours.closedThen': string
  'hours.customHint': string
  'hours.conflicts': string
  'hours.dateRequired': string
  'hours.endBeforeStart': string
  'hours.tooLong': string
  'hours.checkIntervals': string
  'hours.submitAbsence': string
  'hours.dialogCancel': string
  'hours.deleteAbsence': string
  'hours.closedAllDay': string
  'hours.openOnly': string

  'admin.statPending': string
  'admin.pendingEmpty': string
  'admin.addReservation': string
  'admin.bookingRulesTitle': string
  'admin.modeAutomatic': string
  'admin.modeAutomaticHint': string
  'admin.modeManual': string
  'admin.modeManualHint': string
  'admin.slotIntervalHint': string
  'admin.minAdvanceHint': string
  'admin.maxAdvanceHint': string
  'admin.pendingExpirationHint': string
  'admin.unitMinutes': string
  'admin.unitDays': string
  'admin.unitHours': string
  'admin.salonDetailsTitle': string
  'admin.salonDetailsHint': string
  'admin.fieldName': string
  'admin.fieldAddress': string
  'admin.fieldPhone': string
  'admin.fieldEmail': string
  'admin.fieldVatId': string
  'admin.save': string
  'admin.saved': string
  'admin.saveFailed': string
  'admin.rangeError': string
  'admin.requiredError': string
  'admin.emailError': string
  'admin.tooLongError': string
  'admin.weekNumber': string
  'admin.prevWeek': string
  'admin.nextWeek': string
  'admin.thisWeek': string
  'admin.weekTotals': string
  'admin.totalCount': string
  'admin.totalTime': string
  'admin.totalRevenue': string
  'admin.plannerLabel': string
  'admin.plannerLegend': string
  'admin.plannerDayFree': string
  'admin.plannerCount': string
  'admin.plannerCountOne': string
  'admin.viewLabel': string
  'admin.viewWeek': string
  'admin.viewList': string
  'admin.salonAreas': string
  'admin.servicesHint': string
  'admin.backToSettings': string
  'admin.googleCalendarLegend': string
  'admin.googleCalendarEventFallback': string
  'admin.googleCalendarTitle': string
  'admin.googleCalendarHint': string
  'admin.googleCalendarNotConfigured': string
  'admin.googleCalendarConnect': string
  'admin.googleCalendarConnectedAs': string
  'admin.googleCalendarConnectedBanner': string
  'admin.googleCalendarErrorBanner': string
  'admin.googleCalendarSelectLabel': string
  'admin.googleCalendarCustomIdLabel': string
  'admin.googleCalendarUseId': string
  'admin.googleCalendarSyncNow': string
  'admin.googleCalendarSyncResult': string
  'admin.googleCalendarLastSync': string
  'admin.googleCalendarDisconnect': string
  'book.employeeTitle': string
  'book.employeeAny': string
  'admin.employeeAll': string
  'admin.employeeSelectLabel': string
  'admin.googleCalendarForEmployee': string
  'admin.googleCalendarSalonWide': string
}

export type MessageKey = keyof Messages

export const de: Messages = {
  'nav.staffCalendar': 'Kalender',
  'nav.staffPending': 'Anfragen',
  'nav.staffSettings': 'Einstellungen',
  'nav.staffLogin': 'Login für das Team',
  'nav.signedInAs': 'Angemeldet als {email}',
  'nav.main': 'Hauptnavigation',
  'nav.signOut': 'Abmelden',
  'nav.language': 'Sprache',
  'nav.book': 'Termin buchen',
  'nav.home': 'KIMM Hair, zur Startseite',
  'app.pullToRefresh': 'Zum Aktualisieren nach unten ziehen',
  'app.refreshing': 'Wird aktualisiert…',

  'home.place': 'Friseur in Meran',
  'home.intro':
    'Judith Lintner und ihr Team schneiden, färben und pflegen in der Via Piave. Mit Zeit für Ihre Wünsche und Produkten, die Haar und Kopfhaut schonen.',
  'home.book': 'Termin online buchen',
  'home.call': 'Oder anrufen: {phone}',
  'home.servicesTitle': 'Leistungen und Preise',
  'home.servicesHint': 'Wählen Sie eine Leistung, um direkt einen Termin zu suchen.',
  'home.servicesError': 'Die Preisliste konnte nicht geladen werden. Rufen Sie uns gerne an.',
  'home.servicesEmpty': 'Die Preisliste wird gerade überarbeitet. Rufen Sie uns gerne an.',
  'home.hoursTitle': 'Öffnungszeiten',
  'home.hoursError': 'Die Öffnungszeiten konnten nicht geladen werden.',
  'home.closed': 'geschlossen',
  'home.today': 'heute',
  'home.visitTitle': 'So finden Sie uns',
  'home.stylistsTitle': 'Stylistinnen',
  'home.stylesTitle': 'Styles',
  'home.stylesHint': 'Ausgewählte Schnitte, Balayage-Techniken und Colorationen aus unserem Salon.',
  'home.directions': 'Route in Google Maps öffnen',
  'footer.vatId': 'MwSt.-Nr.',
  'footer.privacy': 'Datenschutz',
  'privacy.title': 'Datenschutzerklärung',
  'privacy.updated': 'Stand: November 2026',
  'privacy.intro':
    'Wir freuen uns über Ihr Interesse an unserem Salon. Hier erfahren Sie, welche personenbezogenen Daten wir verarbeiten, wenn Sie diese Website nutzen oder online einen Termin buchen, und welche Rechte Sie nach der Datenschutz-Grundverordnung (DSGVO) haben.',
  'privacy.controllerTitle': 'Verantwortlicher',
  'privacy.controllerContact': 'Telefon: {phone} · E-Mail: {email}',
  'privacy.bookingTitle': 'Online-Terminbuchung',
  'privacy.bookingBody':
    'Wenn Sie online einen Termin anfragen, verarbeiten wir Vorname, Nachname, Telefonnummer, E-Mail-Adresse, die gewählten Leistungen, den Wunschtermin und Ihre optionalen Anmerkungen. Wir nutzen diese Daten ausschließlich, um Ihren Termin zu planen, zu bestätigen und Sie bei Änderungen zu kontaktieren. Ein Kundenkonto ist nicht nötig.\n\nRechtsgrundlage ist die Durchführung vorvertraglicher Maßnahmen bzw. die Erfüllung des Vertrags (Art. 6 Abs. 1 lit. b DSGVO).',
  'privacy.emailTitle': 'E-Mail-Benachrichtigungen',
  'privacy.emailBody':
    'Nach einer Buchung senden wir Ihnen eine Bestätigung mit einem persönlichen Link, über den Sie Ihren Termin ansehen oder absagen können. Für den Versand nutzen wir einen E-Mail-Dienstleister, der Ihre E-Mail-Adresse und den Inhalt der Nachricht nur in unserem Auftrag verarbeitet (Art. 28 DSGVO).',
  'privacy.hostingTitle': 'Hosting und Datenbank',
  'privacy.hostingBody':
    'Diese Website und die Buchungsdaten werden bei Google Firebase (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) betrieben. Beim Aufruf der Seite werden technisch notwendige Daten wie IP-Adresse, Zeitpunkt und Browsertyp verarbeitet, um die Website sicher und stabil auszuliefern (Art. 6 Abs. 1 lit. f DSGVO).\n\nEine Übermittlung an Google LLC in den USA kann nicht ausgeschlossen werden. Sie ist durch das EU-US Data Privacy Framework sowie durch EU-Standardvertragsklauseln abgesichert.',
  'privacy.storageTitle': 'Speicherung in Ihrem Browser',
  'privacy.storageBody':
    'Wir setzen keine Tracking- oder Werbe-Cookies und keine Analyse-Tools ein. Im lokalen Speicher Ihres Browsers merken wir uns nur Ihre Sprachwahl und die Links zu Ihren gebuchten Terminen, damit Sie diese unter „Meine Termine“ wiederfinden. Diese Daten verlassen Ihr Gerät nicht und lassen sich jederzeit über die Browsereinstellungen löschen.',
  'privacy.fontsTitle': 'Schriftarten',
  'privacy.fontsBody':
    'Für eine einheitliche Darstellung lädt diese Website Schriftarten von Google Fonts (Google Ireland Limited). Dabei wird Ihre IP-Adresse an Google übermittelt. Rechtsgrundlage ist unser berechtigtes Interesse an einer ansprechenden Darstellung (Art. 6 Abs. 1 lit. f DSGVO).',
  'privacy.retentionTitle': 'Speicherdauer',
  'privacy.retentionBody':
    'Wir speichern Ihre Buchungsdaten nur so lange, wie es für die Terminabwicklung nötig ist, und löschen sie danach, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.',
  'privacy.rightsTitle': 'Ihre Rechte',
  'privacy.rightsBody':
    'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten, auf Datenübertragbarkeit sowie das Recht, einer Verarbeitung auf Grundlage berechtigter Interessen zu widersprechen (Art. 15–21 DSGVO). Schreiben Sie uns dazu einfach eine E-Mail.',
  'privacy.authorityTitle': 'Beschwerderecht',
  'privacy.authorityBody':
    'Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren, in Italien beim Garante per la protezione dei dati personali (www.garanteprivacy.it).',

  'book.title': 'Termin buchen',
  'book.subtitle': 'Ohne Kundenkonto — Schritt für Schritt zum Wunschtermin.',
  'book.step.service': '1. Leistung wählen',
  'book.step.date': '2. Datum wählen',
  'book.step.time': '3. Uhrzeit wählen',
  'book.step.details': '4. Kontaktdaten',
  'book.step.confirm': '5. Bestätigen',
  'book.servicesLoading': 'Leistungen werden geladen…',
  'book.servicesError': 'Leistungen konnten nicht geladen werden.',
  'book.availabilityLoading': 'Verfügbarkeit wird geladen…',
  'book.availabilityError': 'Verfügbarkeit konnte nicht geladen werden.',
  'book.noSlotsMonth': 'In diesem Zeitraum sind keine Termine frei. Bitte anderen Monat prüfen.',
  'book.noSlotsDay': 'Keine freien Zeiten an diesem Tag.',
  'book.monthPrev': 'Zurück',
  'book.monthNext': 'Weiter',
  'book.firstName': 'Vorname',
  'book.lastName': 'Nachname',
  'book.phone': 'Telefon',
  'book.phoneHelp': 'z. B. 0660 1234567 — wird international gespeichert',
  'book.privacyBefore': 'Ich habe die ',
  'book.privacyLink': 'Datenschutzhinweise',
  'book.privacyAfter': ' zur Kenntnis genommen.',
  'book.opensInNewTab': ' (öffnet in neuem Tab)',
  'book.error.firstNameRequired': 'Bitte geben Sie Ihren Vornamen ein.',
  'book.error.firstNameTooLong': 'Der Vorname darf höchstens 80 Zeichen lang sein.',
  'book.error.lastNameRequired': 'Bitte geben Sie Ihren Nachnamen ein.',
  'book.error.lastNameTooLong': 'Der Nachname darf höchstens 80 Zeichen lang sein.',
  'book.error.phoneInvalid': 'Bitte geben Sie eine gültige Telefonnummer ein, z. B. 0473 123456.',
  'book.error.emailRequired': 'Bitte geben Sie Ihre E-Mail-Adresse ein.',
  'book.error.emailTooLong': 'Die E-Mail-Adresse ist zu lang.',
  'book.error.emailInvalid': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  'book.error.notesTooLong': 'Die Anmerkungen dürfen höchstens 1000 Zeichen lang sein.',
  'book.error.privacyRequired':
    'Bitte bestätigen Sie, dass Sie die Datenschutzhinweise gelesen haben.',
  'book.error.invalid': 'Bitte prüfen Sie Ihre Angaben.',
  'book.error.slotTaken':
    'Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit.',
  'book.error.serviceUnavailable':
    'Diese Leistung ist gerade nicht online buchbar. Bitte rufen Sie uns an.',
  'book.error.submitFailed':
    'Die Buchung hat nicht geklappt. Bitte versuchen Sie es erneut oder rufen Sie uns an.',
  'book.submit': 'Termin verbindlich anfragen',
  'book.submitting': 'Wird gebucht…',
  'book.otherTime': 'Andere Zeit',
  'book.durationMinutes': '{minutes} Min',
  'book.weekday.mo': 'Mo',
  'book.weekday.tu': 'Di',
  'book.weekday.we': 'Mi',
  'book.weekday.th': 'Do',
  'book.weekday.fr': 'Fr',
  'book.weekday.sa': 'Sa',
  'book.weekday.su': 'So',
  'book.step1Title': 'Schritt 1 von 2: Leistungen wählen',
  'book.step2Title': 'Schritt 2 von 2: Termin & Kontaktdaten',
  'book.continueToDate': 'Weiter zur Terminauswahl',
  'book.backToServices': 'Zurück zu den Leistungen',
  'book.selectedServicesCount': '{count} gewählt',
  'book.totalDuration': 'Gesamtdauer: {minutes} Min',
  'book.totalPrice': 'Gesamtpreis: {price}',
  'book.email': 'E-Mail-Adresse',
  'book.notes': 'Notizen / Wünsche (optional)',
  'book.notesPlaceholder': 'Hinweise oder Wünsche an den Friseur…',
  'price.onRequest': 'Preis nach Beratung',

  'confirmed.pendingTitle': 'Anfrage eingegangen',
  'confirmed.confirmedTitle': 'Termin bestätigt',
  'confirmed.pendingBody': 'Der Salon prüft Ihre Anfrage. Der Zeitslot ist vorerst reserviert.',
  'confirmed.confirmedBody': 'Ihr Termin ist gebucht — wir freuen uns auf Ihren Besuch!',
  'confirmed.emailSentNote':
    'Eine E-Mail mit allen Termindetails, Ihrem persönlichen Verwaltungs-Link und dem Kalendereintrag (.ics) ist unterwegs zu Ihnen.',
  'confirmed.saveWarning':
    'Speichern Sie diesen persönlichen Link. Ohne Kundenkonto ist er der einzige Zugang zum Termin. Er wurde auf diesem Gerät unter „Meine Termine“ hinterlegt.',
  'confirmed.linkHeading': 'Ihr Verwaltungs-Link',
  'confirmed.manage': 'Termin verwalten',
  'confirmed.copy': 'Link kopieren',
  'confirmed.share': 'Teilen',
  'confirmed.mailto': 'Per E-Mail senden',
  'confirmed.myBookings': 'Meine Termine',
  'confirmed.home': 'Zur Startseite',
  'confirmed.copied': 'Link in die Zwischenablage kopiert.',
  'confirmed.shared': 'Link geteilt.',
  'confirmed.shareTitle': 'Mein Salon-Termin',
  'confirmed.shareText':
    'Hier ist mein persönlicher Link zum Verwalten des Termins. Bitte aufbewahren.',

  'myBookings.title': 'Meine Termine',
  'myBookings.subtitle':
    'Auf diesem Gerät gespeicherte Verwaltungs-Links. Details werden sicher vom Server geladen.',
  'myBookings.empty':
    'Noch keine Termine auf diesem Gerät. Nach einer Buchung erscheint der Link hier automatisch.',
  'myBookings.open': 'Termin öffnen',
  'myBookings.copy': 'Link kopieren',
  'myBookings.share': 'Teilen',
  'myBookings.mailto': 'Per E-Mail senden',
  'myBookings.remove': 'Von diesem Gerät entfernen',
  'myBookings.bookNew': 'Neuen Termin buchen',
  'myBookings.home': 'Zur Startseite',
  'myBookings.invalid':
    'Link ungültig oder Termin nicht mehr verfügbar (abgelaufen, storniert oder gelöscht).',
  'myBookings.status': 'Status: {status}',
  'myBookings.removed': 'Termin von diesem Gerät entfernt.',
  'myBookings.copied': 'Link kopiert.',
  'myBookings.copyFailed': 'Kopieren nicht möglich.',
  'myBookings.shared': 'Link geteilt.',
  'myBookings.loading': 'Termin laden',
  'myBookings.shareTitle': 'Mein Salon-Termin',
  'myBookings.shareText': 'Hier ist mein persönlicher Link zum Verwalten des Termins.',

  'manage.title': 'Termin verwalten',
  'manage.subtitle': 'Persönlicher Link — kein Login erforderlich.',
  'manage.loading': 'Termin laden',
  'manage.notFound': 'Termin nicht gefunden oder Link ungültig.',
  'manage.status': 'Status: {status}',
  'manage.reschedule': 'Umbuchen',
  'manage.cancelReschedule': 'Abbrechen',
  'manage.cancel': 'Stornieren',
  'manage.cancelling': 'Wird storniert…',
  'manage.immutable': 'Dieser Termin kann nicht mehr geändert werden.',
  'manage.pickTime': 'Neuen Termin wählen',
  'manage.slotsLoading': 'Slots laden',
  'manage.noAlternatives': 'Keine Alternativen in den nächsten Tagen.',
  'manage.home': 'Zur Startseite',
  'manage.actionFailed': 'Aktion fehlgeschlagen',

  'status.PENDING': 'Ausstehend',
  'status.CONFIRMED': 'Bestätigt',
  'status.DECLINED': 'Abgelehnt',
  'status.EXPIRED': 'Abgelaufen',
  'status.CANCELLED': 'Storniert',
  'status.COMPLETED': 'Erledigt',

  'login.title': 'Admin-Anmeldung',
  'login.email': 'E-Mail',
  'login.password': 'Passwort',
  'login.submit': 'Als Admin anmelden',
  'login.submitting': 'Wird angemeldet…',
  'login.hint': 'Lokal nach Seed: {email} / {password}',
  'login.staffOnly':
    'Nur für Salon-Mitarbeiter. Kunden buchen Termine ohne Login — zurück zur Startseite.',
  'login.customerNote': 'Kunden buchen Termine ohne Login über die Startseite.',
  'login.failed': 'Anmeldung fehlgeschlagen',
  'login.backHome': 'Zur Kunden-Startseite',

  'employee.title': 'Mitarbeiter-Bereich',
  'employee.loading': 'Wird geladen…',
  'employee.signInRequired': 'Bitte melden Sie sich an.',
  'employee.forbidden': 'Kein Zugriff auf diesen Bereich.',
  'employee.greeting': 'Angemeldet als {name}',
  'employee.navHours': 'Arbeitszeiten',
  'employee.navServices': 'Dienstleistungen',
  'employee.navBookings': 'Meine Termine',
  'employee.navPassword': 'Passwort',
  'employee.hoursTitle': 'Wöchentliche Zeiten',
  'employee.hoursHint':
    'Pflege Sie Ihre buchbaren Öffnungszeiten. Ungültige Intervalle werden abgelehnt.',
  'employee.hoursError': 'Arbeitszeiten konnten nicht geladen werden.',
  'employee.dayExceptionTitle': 'Abwesenheiten',
  'employee.servicesTitle': 'Zugewiesene Dienstleistungen',
  'employee.servicesHint': 'Nur Leseansicht — Änderungen nimmt die Salonleitung vor.',
  'employee.servicesError': 'Dienstleistungen konnten nicht geladen werden.',
  'employee.servicesEmpty': 'Ihnen sind noch keine Dienstleistungen zugewiesen.',
  'employee.bookingsTitle': 'Meine Termine',
  'employee.bookingsHint': 'Nur Leseansicht der nächsten Wochen.',
  'employee.bookingsError': 'Termine konnten nicht geladen werden.',
  'employee.bookingsEmpty': 'Keine Termine in diesem Zeitraum.',
  'employee.passwordTitle': 'Passwort ändern',
  'employee.passwordHint':
    'Aktuelles Passwort bestätigen, dann neues Passwort setzen (min. 8 Zeichen).',
  'employee.currentPassword': 'Aktuelles Passwort',
  'employee.newPassword': 'Neues Passwort',
  'employee.confirmPassword': 'Neues Passwort bestätigen',
  'employee.passwordMismatch': 'Die Passwörter stimmen nicht überein.',
  'employee.passwordSaved': 'Passwort wurde geändert.',
  'employee.passwordSubmit': 'Passwort speichern',

  'error.somethingWrong': 'Etwas ist schiefgelaufen',
  'error.tryAgain': 'Erneut versuchen',

  'admin.title': 'Admin',
  'admin.calendar': 'Kalender',
  'admin.reservations': 'Termine',
  'admin.time': 'Zeit',
  'admin.timeFreeLabel': 'Freie Zeiten',
  'admin.nextFreeSlotHint':
    'Nächster freier Termin ist vorausgewählt — andere Zeit einfach antippen.',
  'admin.nextFreeSlotTag': 'Nächster',
  'admin.currentSlotKept':
    'Bisherige Uhrzeit {time} bleibt erhalten, bis Sie eine neue freie Zeit wählen.',
  'admin.customer': 'Kunde',
  'admin.status': 'Status',
  'admin.open': 'Öffnen',
  'admin.noReservations': 'Keine Termine im Zeitraum.',
  'admin.reservationsError': 'Termine konnten nicht geladen werden.',
  'admin.services': 'Leistungen',
  'admin.service': 'Leistung',
  'admin.settings': 'Einstellungen',
  'admin.maintenance': 'Abgelaufene Anfragen',
  'admin.maintenanceHint':
    'Unbestätigte Anfragen verfallen automatisch nach der oben eingestellten Frist. Hier lösen Sie die Prüfung sofort aus.',
  'admin.expirePending': 'Ausstehende Anfragen ablaufen lassen',
  'admin.expireResult': 'Ablauf: {expired} von {scanned} ausstehenden Anfragen abgelaufen.',
  'admin.loading': 'Laden…',
  'admin.signInRequired': 'Anmeldung erforderlich.',
  'admin.forbidden': 'Dieser Bereich ist nur für Salon-Administratoren.',
  'admin.today': 'Heute',
  'admin.calendarLoading': 'Kalender laden',
  'admin.detailTitle': 'Termin-Details',
  'admin.backToCalendar': 'Zurück zum Kalender',
  'admin.backToPending': 'Zurück zu Anfragen',
  'admin.detailLoading': 'Termin laden',
  'admin.notFound': 'Termin nicht gefunden.',
  'admin.source': 'Quelle: {source}',
  'admin.note': 'Notiz: {note}',
  'admin.customerNotes': 'Kundenhinweis: {notes}',
  'admin.confirm': 'Bestätigen',
  'admin.decline': 'Ablehnen',
  'admin.complete': 'Als erledigt markieren',
  'admin.cancel': 'Stornieren',
  'admin.quickDetails': 'Details anzeigen',
  'admin.reschedule': 'Umbuchen',
  'admin.cancelConfirmTitle': 'Termin stornieren?',
  'admin.cancelConfirmBody':
    'Der Termin wird storniert und der Slot wieder freigegeben. Das lässt sich nicht rückgängig machen.',
  'admin.cancelConfirmAction': 'Ja, stornieren',
  'admin.declineConfirmTitle': 'Anfrage ablehnen?',
  'admin.declineConfirmBody':
    'Die Anfrage wird abgelehnt und der Slot freigegeben. Der Kunde kann online nicht mehr darüber verfügen.',
  'admin.declineConfirmAction': 'Ja, ablehnen',
  'admin.dialogDismiss': 'Abbrechen',
  'admin.editReservationTitle': 'Termin bearbeiten',
  'admin.editReservationSubtitle':
    'Leistungen, Zeit und Kundendaten ändern. Der Termin behält seinen Status.',
  'admin.saveReservation': 'Änderungen speichern',
  'admin.manualTitle': 'Manueller Termin',
  'admin.manualSubtitle':
    'Für Telefonbuchungen — wird sofort bestätigt. Advance-Limits gelten nicht.',
  'admin.back': 'Zurück',
  'admin.dayLabel': 'Tag',
  'admin.noSlots': 'Keine freien Slots.',
  'admin.emailOptional': 'E-Mail (optional)',
  'admin.noteOptional': 'Interne Notiz (optional)',
  'admin.saving': 'Wird gespeichert…',
  'admin.createReservation': 'Termin anlegen',
  'admin.servicesSubtitle': 'Preisliste für die Website und für Termine, die Sie selbst eintragen.',
  'admin.servicesLoading': 'Leistungen laden',
  'admin.servicesError': 'Leistungen konnten nicht geladen werden.',
  'admin.noServices': 'Noch keine Leistungen.',
  'admin.newService': 'Neue Leistung',
  'admin.editServiceLabel': '{name} bearbeiten',
  'admin.moveServiceUp': '{name} nach oben',
  'admin.moveServiceDown': '{name} nach unten',
  'admin.edit': 'Bearbeiten',
  'admin.editServiceTitle': 'Leistung bearbeiten',
  'admin.servicesKeepHint':
    'Änderungen gelten für neue Buchungen. Bereits gebuchte Termine behalten Leistung, Dauer und Preis.',
  'admin.fieldDescription': 'Beschreibung (optional)',
  'admin.fieldDescriptionHint':
    'Steht in der Preisliste auf der Website, in der jeweiligen Sprache.',
  'admin.fieldDurationHint': 'So lange ist der Kalender für diese Leistung belegt.',
  'admin.fieldActive': 'Online buchbar',
  'admin.fieldActiveHint':
    'Ausgeschaltet verschwindet die Leistung aus Preisliste und Buchung. Gebuchte Termine bleiben bestehen.',
  'admin.inactiveTag': 'Nicht online buchbar',
  'admin.cancelEdit': 'Abbrechen',
  'admin.priceError': 'Bitte einen Betrag wie 26 oder 26,50 eingeben.',
  'admin.name': 'Name',
  'admin.fieldNameDe': 'Name (Deutsch)',
  'admin.fieldNameIt': 'Name (Italienisch)',
  'admin.fieldDescriptionDe': 'Beschreibung (Deutsch, optional)',
  'admin.fieldDescriptionIt': 'Beschreibung (Italienisch, optional)',
  'admin.duration': 'Dauer',
  'admin.price': 'Preis',
  'admin.active': 'Aktiv',
  'admin.yes': 'Ja',
  'admin.no': 'Nein',
  'admin.minutes': '{minutes} Min',
  'admin.durationFrom': 'Dauer (von)',
  'admin.durationTo': 'Bis (Min., optional)',
  'admin.priceFrom': 'Preis (von)',
  'admin.priceTo': 'Bis (€, optional)',
  'admin.homepage': 'Startseite',
  'admin.homepageSubtitle':
    'Bereiche ein- oder ausblenden, Bilder verwalten und eigene Abschnitte hinzufügen.',
  'admin.homepageEditButton': 'Startseite bearbeiten',
  'admin.homepageSectionsTitle': 'Bereiche der Startseite',
  'admin.homepageSectionsHint': 'Blende Standardbereiche aus oder wieder ein.',
  'admin.homepageSectionHero': 'Kopfbereich (Intro)',
  'admin.homepageSectionServices': 'Leistungen & Preise',
  'admin.homepageSectionStyles': 'Styles / Galerie',
  'admin.homepageSectionStylists': 'Stylistinnen / Team',
  'admin.homepageSectionVisit': 'Öffnungszeiten & Kontakt',
  'admin.homepageGalleryTitle': 'Bilder (Styles / Galerie)',
  'admin.homepageGalleryHint': 'Lade neue Fotos hoch oder füge Bild-URLs hinzu.',
  'admin.homepageUploadImage': 'Bild hochladen',
  'admin.homepageUploading': 'Bild wird hochgeladen…',
  'admin.homepageImageUrl': 'Bild-URL',
  'admin.homepageImageAltDe': 'Beschreibung (Deutsch, optional)',
  'admin.homepageImageAltIt': 'Beschreibung (Italienisch, optional)',
  'admin.homepageAddImage': 'Bild hinzufügen',
  'admin.homepageRemoveImage': 'Bild entfernen',
  'admin.homepageResetGallery': 'Standardbilder wiederherstellen',
  'admin.homepageCustomSectionsTitle': 'Eigene Abschnitte',
  'admin.homepageAddSection': 'Abschnitt hinzufügen',
  'admin.homepageRemoveSection': 'Abschnitt entfernen',
  'admin.homepageSectionTitleDe': 'Titel (Deutsch)',
  'admin.homepageSectionTitleIt': 'Titel (Italienisch)',
  'admin.homepageSectionBodyDe': 'Text (Deutsch)',
  'admin.homepageSectionBodyIt': 'Text (Italienisch)',
  'admin.homepageSectionImage': 'Bild-URL (optional)',
  'home.carouselPrev': 'Vorherige Styles',
  'home.carouselNext': 'Nächste Styles',
  'admin.demoModeTitle': 'Demo-Modus',
  'admin.demoModeHint':
    'Füllt den Kalender mit Beispielterminen. Bestehende echte Termine bleiben erhalten.',
  'admin.demoModeSwitch': 'Demo-Termine im Kalender anzeigen',
  'admin.firstAdminTitle': 'Ersten Salon-Admin erstellen',
  'admin.firstAdminHint':
    'Erstellt das Hauptkonto für den Salon. Nur dieses Hauptkonto kann später Mitarbeiter-Konten anlegen.',
  'admin.firstAdminCreated': 'Erster Salon-Admin wurde erstellt.',
  'admin.firstAdminCreateButton': 'Salon-Admin erstellen',
  'admin.firstAdminAlreadyExists': 'Der erste Salon-Admin wurde bereits eingerichtet.',
  'admin.employeesTitle': 'Mitarbeiter-Konten',
  'admin.employeesHint':
    'Nur das Haupt-Admin-Konto kann neue Zugänge für Mitarbeiterinnen und Mitarbeiter erstellen.',
  'admin.employeeCreateButton': 'Mitarbeiter-Konto erstellen',
  'admin.employeeCreated': 'Mitarbeiter-Konto wurde erstellt.',
  'admin.fieldFirstName': 'Vorname',
  'admin.fieldLastName': 'Nachname',
  'admin.employeesManageTitle': 'Mitarbeiter*innen',
  'admin.employeesManageSubtitle':
    'Buchbare Profile, Dienste und Zugänge für Stylist*innen verwalten.',
  'admin.employeesNavTitle': 'Mitarbeiter*innen',
  'admin.employeesNavHint': 'Konten anlegen, Admins verknüpfen, Buchbarkeit und Dienste.',
  'admin.employeesAccessButton': 'Zugang',
  'admin.employeesAccessTitle': 'Zugang verwalten',
  'admin.employeesCreateAccountTitle': 'Neues Mitarbeiter-Konto',
  'admin.employeesCreateAccountHint':
    'Legt einen neuen Login mit Rolle „Mitarbeiter“ und einem buchbaren Profil an.',
  'admin.employeesLinkAdminTitle': 'Admin-Profil verknüpfen',
  'admin.employeesLinkAdminHint':
    'Bestehende Admin-Zugänge ohne Mitarbeiter-Dokument als buchbares Profil einrichten.',
  'admin.employeesLinkAdminPick': 'Admin auswählen',
  'admin.employeesLinkAdminButton': 'Buchbares Profil anlegen',
  'admin.employeesLinkAdminDone': 'Profil wurde verknüpft.',
  'admin.employeesNoLinkableAdmins': 'Alle Admin-Konten haben bereits ein Mitarbeiter-Dokument.',
  'admin.employeesListTitle': 'Alle Profile',
  'admin.employeesLoadError': 'Mitarbeiter konnten nicht geladen werden.',
  'admin.employeesListEmpty': 'Noch keine Mitarbeiter-Profile vorhanden.',
  'admin.employeesProfileTitle': 'Profil',
  'admin.employeesProfileHint': 'Dienste und ob Termine online buchbar sind.',
  'admin.employeesBookableTitle': 'Buchbarkeit',
  'admin.employeesBookableHint':
    'Steuert, ob im Online-Buchungskalender Termine vergeben werden können.',
  'admin.employeesBookableOn': 'Buchbar',
  'admin.employeesBookableOff': 'Nicht buchbar',
  'admin.employeesBookableAuthBlocked':
    'Login ist deaktiviert — zuerst Auth wieder aktivieren, dann Buchbarkeit einschalten.',
  'admin.employeesAuthTitle': 'Login',
  'admin.employeesAuthHint':
    'Nur das Haupt-Admin-Konto kann Zugänge sperren oder Passwörter setzen.',
  'admin.employeesAuthManageButton': 'Login verwalten',
  'admin.employeesAccountTitle': 'Konto',
  'admin.employeesAccountManageButton': 'Konto verwalten',
  'admin.employeesAuthEnabled': 'Login aktiv',
  'admin.employeesAuthDisabled': 'Login deaktiviert',
  'admin.employeesSetPassword': 'Passwort setzen',
  'admin.employeesServicesTitle': 'Dienste',
  'admin.employeesServiceAssignmentTitle': 'Dienst-Zuordnung',
  'admin.employeesServiceAssignmentHint':
    'Pro Dienst festlegen, welche Mitarbeiter*innen buchbar sind. Änderungen werden sofort gespeichert.',
  'admin.employeesServiceAssignmentEmpty': 'Keine Dienste im Katalog.',
  'admin.employeesServiceAssignmentNoEmployees': 'Keine aktiven Profile zum Zuordnen.',
  'admin.employeesHoursTitle': 'Arbeitszeiten',
  'admin.employeesHoursHint': 'Reguläre Wochenzeiten. Geschlossene Tage = kein Intervall.',
  'admin.employeesDayExceptionTitle': 'Abwesenheiten',
  'admin.employeesDayExceptionHint':
    'Persönliche Abwesenheiten (Urlaub, kürzere Tage). Salon-Schließungen gelten automatisch mit.',
  'admin.employeesDayExceptionDate': 'Datum (YYYY-MM-DD)',
  'admin.employeesDayExceptionAdd': 'Abwesenheit hinzufügen',
  'admin.employeesDayExceptionEdit': 'Abwesenheit bearbeiten',
  'admin.employeesDayExceptionEmpty': 'Noch keine Abwesenheiten.',
  'admin.employeesDayExceptionSave': 'Abwesenheit speichern',
  'admin.employeesDayExceptionDelete': 'Abwesenheit löschen',
  'admin.employeesDayExceptionAllDay': 'Ganztags abwesend',
  'admin.employeesDayExceptionPartial': 'Nur {hours} verfügbar',
  'admin.employeesDayExceptionOpenThen': 'An diesem Tag verfügbar: {hours}',
  'admin.employeesDayExceptionAbsentThen': 'An diesem Tag ganz abwesend.',
  'admin.employeesDayExceptionDefaultName': 'Abwesend',
  'admin.employeesBookablePreviewTitle': 'Öffentliche Buchbarkeits-Projektion',
  'admin.employeesBookablePreviewHint':
    'So erscheinen Stylist*innen in der Kunden-Buchung (Callable listBookableEmployees).',
  'admin.employeesBookablePreviewError': 'Projektion konnte nicht geladen werden.',
  'admin.employeesBookablePreviewEmpty': 'Derzeit keine buchbaren Profile.',
  'admin.employeesBookablePreviewServices': '{count} Dienste',
  'admin.employeesSoftRemove': 'Profil entfernen',
  'admin.employeesRemoved': 'Entfernt',
  'admin.employeesError.firstNameInvalid':
    'Bitte einen gültigen Vornamen eingeben (max. 80 Zeichen).',
  'admin.employeesError.lastNameInvalid':
    'Bitte einen gültigen Nachnamen eingeben (max. 80 Zeichen).',
  'admin.employeesError.emailInvalid': 'Bitte eine gültige E-Mail-Adresse eingeben.',
  'admin.employeesError.passwordTooShort': 'Das Passwort muss mindestens 8 Zeichen haben.',
  'admin.employeesError.alreadyExists': 'Für diese Person existiert bereits ein Profil.',
  'admin.employeesError.notFound': 'Mitarbeiterprofil wurde nicht gefunden.',
  'admin.employeesError.featureDisabled':
    'Mitarbeiterverwaltung ist für diesen Salon nicht aktiviert.',
  'admin.employeesError.authDisabledBookable':
    'Ein gesperrtes Konto kann nicht buchbar sein. Bitte zuerst den Login freigeben.',
  'admin.employeesError.mustBeAdmin': 'Nur Admin-Konten können so verknüpft werden.',
  'admin.employeesError.failed': 'Aktion fehlgeschlagen. Bitte erneut versuchen.',
  'admin.primaryAdminBadge': 'Haupt-Admin',
  'admin.accountDisplayName': 'Name',
  'admin.accountEmail': 'E-Mail',
  'admin.accountPassword': 'Passwort (mind. 8 Zeichen)',
  'admin.settingsSubtitle':
    'Leistungen, Öffnungszeiten, Online-Buchung und die Kontaktdaten auf der Website.',
  'admin.settingsLoading': 'Einstellungen laden',
  'admin.settingsError': 'Einstellungen konnten nicht geladen werden.',
  'admin.confirmationMode': 'Neue Buchungen',
  'admin.slotInterval': 'Raster für Startzeiten',
  'admin.minAdvance': 'Mindestvorlauf',
  'admin.maxAdvance': 'Höchstens im Voraus buchbar',
  'admin.pendingExpiration': 'Offene Anfragen verfallen nach',
  'admin.openingHours': 'Öffnungszeiten',
  'admin.openingHoursLoading': 'Laden…',
  'admin.openingHoursError': 'Öffnungszeiten konnten nicht geladen werden.',
  'admin.closed': 'Geschlossen',
  'hours.title': 'Öffnungszeiten & Abwesenheiten',
  'hours.subtitle':
    'Was du hier einträgst, sehen Kund:innen nur so: In geschlossenen Zeiten gibt es einfach keine freien Termine.',
  'hours.weeklyTitle': 'Jede Woche',
  'hours.weeklyHint':
    'Deine normalen Öffnungszeiten. Mit „Zeitraum“ planst du z. B. eine Mittagspause ein.',
  'hours.open': 'Geöffnet',
  'hours.from': 'Von',
  'hours.to': 'Bis',
  'hours.addInterval': 'Zeitraum',
  'hours.removeInterval': 'Zeitraum entfernen',
  'hours.copyToOpenDays': 'Auf alle geöffneten Tage übertragen',
  'hours.copied': 'Übertragen – noch speichern.',
  'hours.intervalOrder': 'Ende muss nach dem Beginn liegen.',
  'hours.intervalOverlap': 'Überschneidet sich mit einem anderen Zeitraum.',
  'hours.intervalInvalid': 'Bitte eine Uhrzeit eingeben.',
  'hours.unsaved': 'Nicht gespeicherte Änderungen',
  'hours.absencesTitle': 'Abwesenheiten & Ausnahmen',
  'hours.absencesHint':
    'Urlaub, Feiertag oder mal ein Vormittag zu – in diesen Zeiten kann niemand online buchen.',
  'hours.addAbsence': 'Abwesenheit eintragen',
  'hours.absencesEmpty': 'Keine geplanten Abwesenheiten.',
  'hours.absencesError': 'Abwesenheiten konnten nicht geladen werden.',
  'hours.kindQuestion': 'Was möchtest du eintragen?',
  'hours.kindDays': 'Ganze Tage',
  'hours.kindDaysHint': 'Urlaub, Feiertag, krank',
  'hours.kindMorning': 'Vormittag zu',
  'hours.kindMorningHint': 'Erst ab 12:00 geöffnet',
  'hours.kindAfternoon': 'Nachmittag zu',
  'hours.kindAfternoonHint': 'Nur bis 12:00 geöffnet',
  'hours.kindCustom': 'Andere Zeiten',
  'hours.kindCustomHint': 'Eigene Öffnungszeiten für einen Tag',
  'hours.firstDay': 'Erster Tag',
  'hours.lastDay': 'Letzter Tag',
  'hours.date': 'Datum',
  'hours.note': 'Notiz (optional)',
  'hours.notePlaceholder': 'z. B. Urlaub',
  'hours.defaultName': 'Geschlossen',
  'hours.dayCount': 'Tage: {count}',
  'hours.openThen': 'An diesem Tag geöffnet: {hours}',
  'hours.closedThen': 'An diesem Tag ist dann ganz geschlossen.',
  'hours.customHint': 'Öffnungszeiten nur für diesen Tag:',
  'hours.conflicts':
    'Bestehende Termine in dieser Zeit: {count}. Sie bleiben bestehen – bitte bei Bedarf selbst absagen.',
  'hours.dateRequired': 'Bitte ein Datum wählen.',
  'hours.endBeforeStart': 'Der letzte Tag liegt vor dem ersten.',
  'hours.tooLong': 'Höchstens ein Jahr am Stück.',
  'hours.checkIntervals': 'Bitte die Zeiten prüfen.',
  'hours.submitAbsence': 'Eintragen',
  'hours.dialogCancel': 'Abbrechen',
  'hours.deleteAbsence': 'Abwesenheit löschen',
  'hours.closedAllDay': 'Ganztags geschlossen',
  'hours.openOnly': 'Nur {hours} geöffnet',
  'admin.statPending': 'Offene Anfragen',
  'admin.pendingEmpty': 'Keine offenen Anfragen.',
  'admin.addReservation': 'Termin eintragen',
  'admin.bookingRulesTitle': 'Online-Buchung',
  'admin.modeAutomatic': 'Automatisch bestätigen',
  'admin.modeAutomaticHint': 'Freie Termine sind sofort fest gebucht.',
  'admin.modeManual': 'Jede Anfrage selbst bestätigen',
  'admin.modeManualHint': 'Der Termin bleibt reserviert, bis Sie ihn bestätigen oder ablehnen.',
  'admin.slotIntervalHint': 'Alle wie viele Minuten ein Termin beginnen kann.',
  'admin.minAdvanceHint': 'So kurzfristig kann frühestens online gebucht werden.',
  'admin.maxAdvanceHint': 'So weit im Voraus zeigt der Buchungskalender freie Termine.',
  'admin.pendingExpirationHint': 'Gilt nur, wenn Sie Anfragen selbst bestätigen.',
  'admin.unitMinutes': 'Minuten',
  'admin.unitDays': 'Tage',
  'admin.unitHours': 'Stunden',
  'admin.salonDetailsTitle': 'Salon und Kontakt',
  'admin.salonDetailsHint': 'Erscheint auf der Startseite und im Fußbereich der Website.',
  'admin.fieldName': 'Name des Salons',
  'admin.fieldAddress': 'Adresse',
  'admin.fieldPhone': 'Telefon',
  'admin.fieldEmail': 'E-Mail',
  'admin.fieldVatId': 'MwSt.-Nr. (optional)',
  'admin.save': 'Speichern',
  'admin.saved': 'Gespeichert.',
  'admin.saveFailed': 'Speichern fehlgeschlagen: {message}',
  'admin.rangeError': 'Erlaubt sind ganze Zahlen von {min} bis {max}.',
  'admin.requiredError': 'Bitte ausfüllen.',
  'admin.emailError': 'Bitte eine gültige E-Mail-Adresse eingeben.',
  'admin.tooLongError': 'Höchstens {max} Zeichen.',
  'admin.weekNumber': 'KW {week}',
  'admin.prevWeek': 'Vorherige Woche',
  'admin.nextWeek': 'Nächste Woche',
  'admin.thisWeek': 'Diese Woche',
  'admin.weekTotals': 'Summe der Woche',
  'admin.totalCount': 'Termine',
  'admin.totalTime': 'Gebuchte Zeit',
  'admin.totalRevenue': 'Umsatz',
  'admin.plannerLabel': 'Wochenkalender',
  'admin.plannerLegend': 'Legende',
  'admin.plannerDayFree': 'Noch frei',
  'admin.plannerCount': '{count} Termine',
  'admin.plannerCountOne': '1 Termin',
  'admin.viewLabel': 'Ansicht',
  'admin.viewWeek': 'Woche',
  'admin.viewList': 'Liste',
  'admin.salonAreas': 'Salon',
  'admin.servicesHint': 'Preise, Dauer und welche Leistungen online buchbar sind.',
  'admin.backToSettings': 'Zu den Einstellungen',
  'admin.googleCalendarLegend': 'Google Kalender / Blockiert',
  'admin.googleCalendarEventFallback': 'Google Kalender',
  'admin.googleCalendarTitle': 'Google Kalender',
  'admin.googleCalendarHint':
    'Verbinde einen Google Kalender, um externe Termine automatisch zu blockieren und Kundenbuchungen dorthin zu synchronisieren.',
  'admin.googleCalendarNotConfigured':
    'Google Kalender OAuth ist auf dem Server noch nicht konfiguriert (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET).',
  'admin.googleCalendarConnect': 'Google Kalender verbinden',
  'admin.googleCalendarConnectedAs': 'Verbunden mit {email}',
  'admin.googleCalendarConnectedBanner': 'Google Kalender wurde erfolgreich verbunden.',
  'admin.googleCalendarErrorBanner':
    'Die Verbindung mit Google Kalender ist fehlgeschlagen. Bitte erneut versuchen.',
  'admin.googleCalendarSelectLabel': 'Kalender auswählen',
  'admin.googleCalendarCustomIdLabel': 'Oder geteilte Kalender-ID eingeben',
  'admin.googleCalendarUseId': 'Kalender verwenden',
  'admin.googleCalendarSyncNow': 'Jetzt synchronisieren',
  'admin.googleCalendarSyncResult':
    'Synchronisiert: {blocked} externe Termine, {pushed} Buchungen übertragen.',
  'admin.googleCalendarLastSync': 'Letzte Synchronisierung: {time}',
  'admin.googleCalendarDisconnect': 'Trennen',
  'book.employeeTitle': 'Stylist*in auswählen',
  'book.employeeAny': 'Beliebig (nächster freier Termin)',
  'admin.employeeAll': 'Alle Mitarbeiter*innen',
  'admin.employeeSelectLabel': 'Kalender',
  'admin.googleCalendarForEmployee': 'Google Kalender für',
  'admin.googleCalendarSalonWide': 'Salon-Kalender (Standard)',
}

export const it: Messages = {
  'nav.staffCalendar': 'Calendario',
  'nav.staffPending': 'Richieste',
  'nav.staffSettings': 'Impostazioni',
  'nav.staffLogin': 'Accesso per il team',
  'nav.signedInAs': 'Accesso come {email}',
  'nav.main': 'Navigazione principale',
  'nav.signOut': 'Esci',
  'nav.language': 'Lingua',
  'nav.book': 'Prenota',
  'nav.home': 'KIMM Hair, vai alla home',
  'app.pullToRefresh': 'Trascina verso il basso per aggiornare',
  'app.refreshing': 'Aggiornamento…',

  'home.place': 'Parrucchiere a Merano',
  'home.intro':
    'Judith Lintner e il suo team tagliano, colorano e curano i capelli in Via Piave. Con tempo per i vostri desideri e prodotti delicati per capelli e cute.',
  'home.book': 'Prenota online',
  'home.call': 'Oppure chiamate: {phone}',
  'home.servicesTitle': 'Servizi e prezzi',
  'home.servicesHint': 'Scegliete un servizio per cercare subito un appuntamento.',
  'home.servicesError': 'Impossibile caricare il listino. Chiamateci pure.',
  'home.servicesEmpty': 'Stiamo aggiornando il listino. Chiamateci pure.',
  'home.hoursTitle': 'Orari di apertura',
  'home.hoursError': 'Impossibile caricare gli orari di apertura.',
  'home.closed': 'chiuso',
  'home.today': 'oggi',
  'home.visitTitle': 'Come trovarci',
  'home.stylistsTitle': 'Il team',
  'home.stylesTitle': 'Styles',
  'home.stylesHint': 'Tagli selezionati, tecniche balayage e colorazioni dal nostro salone.',
  'home.directions': 'Apri il percorso in Google Maps',
  'footer.vatId': 'P. IVA',
  'footer.privacy': 'Privacy',
  'privacy.title': 'Informativa sulla privacy',
  'privacy.updated': 'Aggiornata a novembre 2026',
  'privacy.intro':
    'Grazie per l’interesse nel nostro salone. Qui trova quali dati personali trattiamo quando utilizza questo sito o prenota un appuntamento online, e quali diritti le spettano ai sensi del Regolamento generale sulla protezione dei dati (GDPR).',
  'privacy.controllerTitle': 'Titolare del trattamento',
  'privacy.controllerContact': 'Telefono: {phone} · E-mail: {email}',
  'privacy.bookingTitle': 'Prenotazione online',
  'privacy.bookingBody':
    'Quando richiede un appuntamento online trattiamo nome, cognome, numero di telefono, indirizzo e-mail, i servizi scelti, la data desiderata ed eventuali note. Utilizziamo questi dati esclusivamente per pianificare e confermare l’appuntamento e per contattarla in caso di modifiche. Non serve alcun account cliente.\n\nLa base giuridica è l’esecuzione di misure precontrattuali o del contratto (art. 6, par. 1, lett. b GDPR).',
  'privacy.emailTitle': 'Notifiche via e-mail',
  'privacy.emailBody':
    'Dopo la prenotazione le inviamo una conferma con un link personale per visualizzare o annullare l’appuntamento. Per l’invio ci avvaliamo di un fornitore di servizi e-mail che tratta il suo indirizzo e il contenuto del messaggio solo per nostro conto (art. 28 GDPR).',
  'privacy.hostingTitle': 'Hosting e database',
  'privacy.hostingBody':
    'Questo sito e i dati delle prenotazioni sono gestiti tramite Google Firebase (Google Ireland Limited, Gordon House, Barrow Street, Dublino 4, Irlanda). All’apertura del sito vengono trattati dati tecnicamente necessari come indirizzo IP, data e ora e tipo di browser, per fornire il sito in modo sicuro e stabile (art. 6, par. 1, lett. f GDPR).\n\nNon si può escludere un trasferimento a Google LLC negli Stati Uniti. Esso è tutelato dal EU-US Data Privacy Framework e dalle clausole contrattuali standard dell’UE.',
  'privacy.storageTitle': 'Memorizzazione nel browser',
  'privacy.storageBody':
    'Non utilizziamo cookie di tracciamento o pubblicitari né strumenti di analisi. Nella memoria locale del browser salviamo solo la lingua scelta e i link ai suoi appuntamenti, così da ritrovarli in «I miei appuntamenti». Questi dati restano sul suo dispositivo e possono essere eliminati in qualsiasi momento dalle impostazioni del browser.',
  'privacy.fontsTitle': 'Caratteri tipografici',
  'privacy.fontsBody':
    'Per una visualizzazione uniforme questo sito carica i caratteri da Google Fonts (Google Ireland Limited). In tal modo il suo indirizzo IP viene trasmesso a Google. La base giuridica è il nostro legittimo interesse a una presentazione curata (art. 6, par. 1, lett. f GDPR).',
  'privacy.retentionTitle': 'Durata della conservazione',
  'privacy.retentionBody':
    'Conserviamo i dati della prenotazione solo per il tempo necessario a gestire l’appuntamento e li cancelliamo in seguito, salvo obblighi di conservazione previsti dalla legge.',
  'privacy.rightsTitle': 'I suoi diritti',
  'privacy.rightsBody':
    'Ha diritto di accesso, rettifica, cancellazione e limitazione del trattamento dei suoi dati, alla portabilità dei dati e di opporsi a un trattamento basato sul legittimo interesse (artt. 15–21 GDPR). Basta scriverci un’e-mail.',
  'privacy.authorityTitle': 'Diritto di reclamo',
  'privacy.authorityBody':
    'Può proporre reclamo a un’autorità di controllo, in Italia al Garante per la protezione dei dati personali (www.garanteprivacy.it).',

  'book.title': 'Prenota un appuntamento',
  'book.subtitle': 'Senza account — passo dopo passo fino all’orario desiderato.',
  'book.step.service': '1. Scegli il servizio',
  'book.step.date': '2. Scegli la data',
  'book.step.time': '3. Scegli l’orario',
  'book.step.details': '4. Dati di contatto',
  'book.step.confirm': '5. Conferma',
  'book.servicesLoading': 'Caricamento servizi…',
  'book.servicesError': 'Impossibile caricare i servizi.',
  'book.availabilityLoading': 'Caricamento disponibilità…',
  'book.availabilityError': 'Impossibile caricare la disponibilità.',
  'book.noSlotsMonth': 'Nessun appuntamento disponibile in questo periodo. Prova un altro mese.',
  'book.noSlotsDay': 'Nessun orario libero in questo giorno.',
  'book.monthPrev': 'Indietro',
  'book.monthNext': 'Avanti',
  'book.firstName': 'Nome',
  'book.lastName': 'Cognome',
  'book.phone': 'Telefono',
  'book.phoneHelp': 'es. 0660 1234567 — salvato in formato internazionale',
  'book.privacyBefore': 'Ho preso visione dell’',
  'book.privacyLink': 'informativa sulla privacy',
  'book.privacyAfter': '.',
  'book.opensInNewTab': ' (si apre in una nuova scheda)',
  'book.error.firstNameRequired': 'Inserisca il suo nome.',
  'book.error.firstNameTooLong': 'Il nome può contenere al massimo 80 caratteri.',
  'book.error.lastNameRequired': 'Inserisca il suo cognome.',
  'book.error.lastNameTooLong': 'Il cognome può contenere al massimo 80 caratteri.',
  'book.error.phoneInvalid': 'Inserisca un numero di telefono valido, ad es. 0473 123456.',
  'book.error.emailRequired': 'Inserisca il suo indirizzo e-mail.',
  'book.error.emailTooLong': 'L’indirizzo e-mail è troppo lungo.',
  'book.error.emailInvalid': 'Inserisca un indirizzo e-mail valido.',
  'book.error.notesTooLong': 'Le note possono contenere al massimo 1000 caratteri.',
  'book.error.privacyRequired': 'Confermi di aver letto l’informativa sulla privacy.',
  'book.error.invalid': 'Controlli i dati inseriti.',
  'book.error.slotTaken': 'Questo orario è appena stato prenotato. Scelga un altro orario.',
  'book.error.serviceUnavailable':
    'Questo servizio al momento non è prenotabile online. Ci chiami.',
  'book.error.submitFailed': 'La prenotazione non è andata a buon fine. Riprovi o ci chiami.',
  'book.submit': 'Richiedi appuntamento',
  'book.submitting': 'Prenotazione in corso…',
  'book.otherTime': 'Altro orario',
  'book.durationMinutes': '{minutes} min',
  'book.weekday.mo': 'Lu',
  'book.weekday.tu': 'Ma',
  'book.weekday.we': 'Me',
  'book.weekday.th': 'Gi',
  'book.weekday.fr': 'Ve',
  'book.weekday.sa': 'Sa',
  'book.weekday.su': 'Do',
  'book.step1Title': 'Passo 1 di 2: Scegli i servizi',
  'book.step2Title': 'Passo 2 di 2: Data, orario e contatti',
  'book.continueToDate': 'Continua alla scelta della data',
  'book.backToServices': 'Torna ai servizi',
  'book.selectedServicesCount': '{count} selezionati',
  'book.totalDuration': 'Durata totale: {minutes} min',
  'book.totalPrice': 'Prezzo totale: {price}',
  'book.email': 'Indirizzo e-mail',
  'book.notes': 'Note / desideri (opzionale)',
  'book.notesPlaceholder': 'Indicazioni o desideri per il parrucchiere…',
  'price.onRequest': 'Prezzo su richiesta',

  'confirmed.pendingTitle': 'Richiesta ricevuta',
  'confirmed.confirmedTitle': 'Appuntamento confermato',
  'confirmed.pendingBody':
    'Il salone sta esaminando la richiesta. Lo slot è riservato temporaneamente.',
  'confirmed.confirmedBody': 'Il tuo appuntamento è confermato — non vediamo l’ora di accoglierti!',
  'confirmed.emailSentNote':
    'Ti abbiamo inviato un’e-mail con tutti i dettagli, il link personale per gestire l’appuntamento e il file calendario (.ics).',
  'confirmed.saveWarning':
    'Salva questo link personale. Senza account è l’unico modo per gestire l’appuntamento. È stato salvato su questo dispositivo in “I miei appuntamenti”.',
  'confirmed.linkHeading': 'Il tuo link di gestione',
  'confirmed.manage': 'Gestisci appuntamento',
  'confirmed.copy': 'Copia link',
  'confirmed.share': 'Condividi',
  'confirmed.mailto': 'Invia via e-mail',
  'confirmed.myBookings': 'I miei appuntamenti',
  'confirmed.home': 'Torna alla home',
  'confirmed.copied': 'Link copiato negli appunti.',
  'confirmed.shared': 'Link condiviso.',
  'confirmed.shareTitle': 'Il mio appuntamento',
  'confirmed.shareText': 'Ecco il mio link personale per gestire l’appuntamento. Conservalo.',

  'myBookings.title': 'I miei appuntamenti',
  'myBookings.subtitle':
    'Link di gestione salvati su questo dispositivo. I dettagli vengono caricati in modo sicuro dal server.',
  'myBookings.empty':
    'Nessun appuntamento su questo dispositivo. Dopo una prenotazione il link compare qui automaticamente.',
  'myBookings.open': 'Apri appuntamento',
  'myBookings.copy': 'Copia link',
  'myBookings.share': 'Condividi',
  'myBookings.mailto': 'Invia via e-mail',
  'myBookings.remove': 'Rimuovi da questo dispositivo',
  'myBookings.bookNew': 'Prenota un nuovo appuntamento',
  'myBookings.home': 'Torna alla home',
  'myBookings.invalid':
    'Link non valido oppure appuntamento non più disponibile (scaduto, annullato o eliminato).',
  'myBookings.status': 'Stato: {status}',
  'myBookings.removed': 'Appuntamento rimosso da questo dispositivo.',
  'myBookings.copied': 'Link copiato.',
  'myBookings.copyFailed': 'Impossibile copiare.',
  'myBookings.shared': 'Link condiviso.',
  'myBookings.loading': 'Caricamento appuntamento',
  'myBookings.shareTitle': 'Il mio appuntamento',
  'myBookings.shareText': 'Ecco il mio link personale per gestire l’appuntamento.',

  'manage.title': 'Gestisci appuntamento',
  'manage.subtitle': 'Link personale — nessun login richiesto.',
  'manage.loading': 'Caricamento appuntamento',
  'manage.notFound': 'Appuntamento non trovato o link non valido.',
  'manage.status': 'Stato: {status}',
  'manage.reschedule': 'Riprogramma',
  'manage.cancelReschedule': 'Annulla',
  'manage.cancel': 'Cancella',
  'manage.cancelling': 'Cancellazione…',
  'manage.immutable': 'Questo appuntamento non può più essere modificato.',
  'manage.pickTime': 'Scegli un nuovo appuntamento',
  'manage.slotsLoading': 'Caricamento orari',
  'manage.noAlternatives': 'Nessuna alternativa nei prossimi giorni.',
  'manage.home': 'Torna alla home',
  'manage.actionFailed': 'Operazione non riuscita',

  'status.PENDING': 'In attesa',
  'status.CONFIRMED': 'Confermato',
  'status.DECLINED': 'Rifiutato',
  'status.EXPIRED': 'Scaduto',
  'status.CANCELLED': 'Annullato',
  'status.COMPLETED': 'Completato',

  'login.title': 'Accesso admin',
  'login.email': 'E-mail',
  'login.password': 'Password',
  'login.submit': 'Accedi come admin',
  'login.submitting': 'Accesso in corso…',
  'login.hint': 'Locale dopo seed: {email} / {password}',
  'login.staffOnly':
    'Solo per lo staff del salone. I clienti prenotano senza login — torna alla home.',
  'login.customerNote': 'I clienti prenotano senza login dalla home.',
  'login.failed': 'Accesso non riuscito',
  'login.backHome': 'Torna alla home clienti',

  'employee.title': 'Area dipendente',
  'employee.loading': 'Caricamento…',
  'employee.signInRequired': 'Accedi per continuare.',
  'employee.forbidden': 'Nessun accesso a questa area.',
  'employee.greeting': 'Accesso come {name}',
  'employee.navHours': 'Orari di lavoro',
  'employee.navServices': 'Servizi',
  'employee.navBookings': 'I miei appuntamenti',
  'employee.navPassword': 'Password',
  'employee.hoursTitle': 'Orari settimanali',
  'employee.hoursHint': 'Gestisci gli orari prenotabili. Intervalli non validi vengono rifiutati.',
  'employee.hoursError': 'Impossibile caricare gli orari.',
  'employee.dayExceptionTitle': 'Assenze',
  'employee.servicesTitle': 'Servizi assegnati',
  'employee.servicesHint': 'Sola lettura — le modifiche le fa la direzione.',
  'employee.servicesError': 'Impossibile caricare i servizi.',
  'employee.servicesEmpty': 'Nessun servizio assegnato.',
  'employee.bookingsTitle': 'I miei appuntamenti',
  'employee.bookingsHint': 'Sola lettura per le prossime settimane.',
  'employee.bookingsError': 'Impossibile caricare gli appuntamenti.',
  'employee.bookingsEmpty': 'Nessun appuntamento in questo periodo.',
  'employee.passwordTitle': 'Cambia password',
  'employee.passwordHint': 'Conferma la password attuale, poi imposta la nuova (min. 8 caratteri).',
  'employee.currentPassword': 'Password attuale',
  'employee.newPassword': 'Nuova password',
  'employee.confirmPassword': 'Conferma nuova password',
  'employee.passwordMismatch': 'Le password non coincidono.',
  'employee.passwordSaved': 'Password aggiornata.',
  'employee.passwordSubmit': 'Salva password',

  'error.somethingWrong': 'Qualcosa è andato storto',
  'error.tryAgain': 'Riprova',

  'admin.title': 'Admin',
  'admin.calendar': 'Calendario',
  'admin.reservations': 'Appuntamenti',
  'admin.time': 'Orario',
  'admin.timeFreeLabel': 'Orari liberi',
  'admin.nextFreeSlotHint':
    'Il prossimo appuntamento libero è preselezionato — tocca un altro orario per cambiarlo.',
  'admin.nextFreeSlotTag': 'Prossimo',
  'admin.currentSlotKept': 'L’orario attuale {time} resta finché non scegli un nuovo slot libero.',
  'admin.customer': 'Cliente',
  'admin.status': 'Stato',
  'admin.open': 'Apri',
  'admin.noReservations': 'Nessun appuntamento nel periodo.',
  'admin.reservationsError': 'Impossibile caricare gli appuntamenti.',
  'admin.services': 'Servizi',
  'admin.service': 'Servizio',
  'admin.settings': 'Impostazioni',
  'admin.maintenance': 'Richieste scadute',
  'admin.maintenanceHint':
    'Le richieste non confermate scadono automaticamente dopo il termine impostato sopra. Qui può avviare subito il controllo.',
  'admin.expirePending': 'Fai scadere le richieste in attesa',
  'admin.expireResult': 'Scadenza: {expired} di {scanned} richieste in attesa scadute.',
  'admin.loading': 'Caricamento…',
  'admin.signInRequired': 'Accesso richiesto.',
  'admin.forbidden': 'Area riservata agli amministratori del salone.',
  'admin.today': 'Oggi',
  'admin.calendarLoading': 'Caricamento calendario',
  'admin.detailTitle': 'Dettagli appuntamento',
  'admin.backToCalendar': 'Torna al calendario',
  'admin.backToPending': 'Torna alle richieste',
  'admin.detailLoading': 'Caricamento appuntamento',
  'admin.notFound': 'Appuntamento non trovato.',
  'admin.source': 'Origine: {source}',
  'admin.note': 'Nota: {note}',
  'admin.customerNotes': 'Note cliente: {notes}',
  'admin.confirm': 'Conferma',
  'admin.decline': 'Rifiuta',
  'admin.complete': 'Segna come completato',
  'admin.cancel': 'Annulla',
  'admin.quickDetails': 'Mostra dettagli',
  'admin.reschedule': 'Riprogramma',
  'admin.cancelConfirmTitle': 'Annullare l’appuntamento?',
  'admin.cancelConfirmBody':
    'L’appuntamento verrà annullato e lo slot liberato. Non si può annullare questa azione.',
  'admin.cancelConfirmAction': 'Sì, annulla',
  'admin.declineConfirmTitle': 'Rifiutare la richiesta?',
  'admin.declineConfirmBody':
    'La richiesta verrà rifiutata e lo slot liberato. Il cliente non potrà più gestirla online.',
  'admin.declineConfirmAction': 'Sì, rifiuta',
  'admin.dialogDismiss': 'Chiudi',
  'admin.editReservationTitle': 'Modifica appuntamento',
  'admin.editReservationSubtitle':
    'Modifica servizi, orario e dati del cliente. Lo stato dell’appuntamento resta invariato.',
  'admin.saveReservation': 'Salva modifiche',
  'admin.manualTitle': 'Appuntamento manuale',
  'admin.manualSubtitle':
    'Per prenotazioni telefoniche — confermato subito. I limiti di anticipo non valgono.',
  'admin.back': 'Indietro',
  'admin.dayLabel': 'Giorno',
  'admin.noSlots': 'Nessuno slot libero.',
  'admin.emailOptional': 'E-mail (opzionale)',
  'admin.noteOptional': 'Nota interna (opzionale)',
  'admin.saving': 'Salvataggio…',
  'admin.createReservation': 'Crea appuntamento',
  'admin.servicesSubtitle': 'Listino per il sito e per gli appuntamenti inseriti da voi.',
  'admin.servicesLoading': 'Caricamento servizi',
  'admin.servicesError': 'Impossibile caricare i servizi.',
  'admin.noServices': 'Nessun servizio ancora.',
  'admin.newService': 'Nuovo servizio',
  'admin.editServiceLabel': 'Modifica {name}',
  'admin.moveServiceUp': 'Sposta {name} in alto',
  'admin.moveServiceDown': 'Sposta {name} in basso',
  'admin.edit': 'Modifica',
  'admin.editServiceTitle': 'Modifica servizio',
  'admin.servicesKeepHint':
    'Le modifiche valgono per le nuove prenotazioni. Gli appuntamenti già prenotati mantengono servizio, durata e prezzo.',
  'admin.fieldDescription': 'Descrizione (facoltativa)',
  'admin.fieldDescriptionHint': 'Appare nel listino prezzi sul sito, nella lingua corrispondente.',
  'admin.fieldDurationHint': 'Per questo tempo il calendario risulta occupato.',
  'admin.fieldActive': 'Prenotabile online',
  'admin.fieldActiveHint':
    'Se disattivato, il servizio sparisce dal listino e dalla prenotazione. Gli appuntamenti prenotati restano.',
  'admin.inactiveTag': 'Non prenotabile online',
  'admin.cancelEdit': 'Annulla',
  'admin.priceError': 'Inserite un importo come 26 o 26,50.',
  'admin.name': 'Nome',
  'admin.fieldNameDe': 'Nome (tedesco)',
  'admin.fieldNameIt': 'Nome (italiano)',
  'admin.fieldDescriptionDe': 'Descrizione (tedesco, facoltativa)',
  'admin.fieldDescriptionIt': 'Descrizione (italiano, facoltativa)',
  'admin.duration': 'Durata',
  'admin.price': 'Prezzo',
  'admin.active': 'Attivo',
  'admin.yes': 'Sì',
  'admin.no': 'No',
  'admin.minutes': '{minutes} min',
  'admin.durationFrom': 'Durata (da)',
  'admin.durationTo': 'Fino a (min, fac.)',
  'admin.priceFrom': 'Prezzo (da)',
  'admin.priceTo': 'Fino a (€, fac.)',
  'admin.homepage': 'Home page',
  'admin.homepageSubtitle':
    'Mostra o nascondi sezioni, gestisci le immagini e aggiungi sezioni personalizzate.',
  'admin.homepageEditButton': 'Modifica home',
  'admin.homepageSectionsTitle': 'Sezioni della home page',
  'admin.homepageSectionsHint': 'Nascondi o mostra nuovamente le sezioni predefinite.',
  'admin.homepageSectionHero': 'Intestazione (Intro)',
  'admin.homepageSectionServices': 'Servizi e prezzi',
  'admin.homepageSectionStyles': 'Styles / Galleria',
  'admin.homepageSectionStylists': 'Stiliste / Team',
  'admin.homepageSectionVisit': 'Orari e contatti',
  'admin.homepageGalleryTitle': 'Immagini (Styles / Galleria)',
  'admin.homepageGalleryHint': 'Carica nuove foto o aggiungi URL di immagini.',
  'admin.homepageUploadImage': 'Carica immagine',
  'admin.homepageUploading': 'Caricamento immagine…',
  'admin.homepageImageUrl': 'URL immagine',
  'admin.homepageImageAltDe': 'Descrizione (tedesco, fac.)',
  'admin.homepageImageAltIt': 'Descrizione (italiano, fac.)',
  'admin.homepageAddImage': 'Aggiungi immagine',
  'admin.homepageRemoveImage': 'Rimuovi immagine',
  'admin.homepageResetGallery': 'Ripristina immagini predefinite',
  'admin.homepageCustomSectionsTitle': 'Sezioni personalizzate',
  'admin.homepageAddSection': 'Aggiungi sezione',
  'admin.homepageRemoveSection': 'Rimuovi sezione',
  'admin.homepageSectionTitleDe': 'Titolo (tedesco)',
  'admin.homepageSectionTitleIt': 'Titolo (italiano)',
  'admin.homepageSectionBodyDe': 'Testo (tedesco)',
  'admin.homepageSectionBodyIt': 'Testo (italiano)',
  'admin.homepageSectionImage': 'URL immagine (facoltativo)',
  'home.carouselPrev': 'Stili precedenti',
  'home.carouselNext': 'Stili successivi',
  'admin.demoModeTitle': 'Modalità demo',
  'admin.demoModeHint':
    'Riempie il calendario con appuntamenti di esempio. Gli appuntamenti reali restano invariati.',
  'admin.demoModeSwitch': 'Mostra appuntamenti demo nel calendario',
  'admin.firstAdminTitle': 'Crea il primo amministratore del salone',
  'admin.firstAdminHint':
    'Crea l’account principale del salone. Solo questo account potrà creare nuovi account per i collaboratori.',
  'admin.firstAdminCreated': 'Primo amministratore del salone creato.',
  'admin.firstAdminCreateButton': 'Crea amministratore',
  'admin.firstAdminAlreadyExists': 'Il primo amministratore del salone è già stato configurato.',
  'admin.employeesTitle': 'Account collaboratori',
  'admin.employeesHint':
    'Solo l’amministratore principale può creare nuovi account per i collaboratori.',
  'admin.employeeCreateButton': 'Crea account collaboratore',
  'admin.employeeCreated': 'Account collaboratore creato.',
  'admin.fieldFirstName': 'Nome',
  'admin.fieldLastName': 'Cognome',
  'admin.employeesManageTitle': 'Collaboratori',
  'admin.employeesManageSubtitle':
    'Gestisci profili prenotabili, servizi e accessi per gli stilisti.',
  'admin.employeesNavTitle': 'Collaboratori',
  'admin.employeesNavHint': 'Crea account, collega admin, prenotabilità e servizi.',
  'admin.employeesAccessButton': 'Accesso',
  'admin.employeesAccessTitle': 'Gestisci accesso',
  'admin.employeesCreateAccountTitle': 'Nuovo account collaboratore',
  'admin.employeesCreateAccountHint':
    'Crea un login con ruolo “collaboratore” e un profilo prenotabile.',
  'admin.employeesLinkAdminTitle': 'Collega profilo admin',
  'admin.employeesLinkAdminHint':
    'Configura un profilo prenotabile per un admin senza documento collaboratore.',
  'admin.employeesLinkAdminPick': 'Seleziona admin',
  'admin.employeesLinkAdminButton': 'Crea profilo prenotabile',
  'admin.employeesLinkAdminDone': 'Profilo collegato.',
  'admin.employeesNoLinkableAdmins': 'Tutti gli admin hanno già un documento collaboratore.',
  'admin.employeesListTitle': 'Tutti i profili',
  'admin.employeesLoadError': 'Impossibile caricare i collaboratori.',
  'admin.employeesListEmpty': 'Nessun profilo collaboratore presente.',
  'admin.employeesProfileTitle': 'Profilo',
  'admin.employeesProfileHint': 'Servizi e se gli appuntamenti sono prenotabili online.',
  'admin.employeesBookableTitle': 'Prenotabilità',
  'admin.employeesBookableHint':
    'Determina se si possono assegnare appuntamenti nel calendario online.',
  'admin.employeesBookableOn': 'Prenotabile',
  'admin.employeesBookableOff': 'Non prenotabile',
  'admin.employeesBookableAuthBlocked':
    'Accesso disattivato — riattiva prima l’auth, poi la prenotabilità.',
  'admin.employeesAuthTitle': 'Accesso',
  'admin.employeesAuthHint': 'Solo l’admin principale può bloccare accessi o impostare password.',
  'admin.employeesAuthManageButton': 'Gestisci accesso',
  'admin.employeesAccountTitle': 'Account',
  'admin.employeesAccountManageButton': 'Gestisci account',
  'admin.employeesAuthEnabled': 'Accesso attivo',
  'admin.employeesAuthDisabled': 'Accesso disattivato',
  'admin.employeesSetPassword': 'Imposta password',
  'admin.employeesServicesTitle': 'Servizi',
  'admin.employeesServiceAssignmentTitle': 'Assegnazione servizi',
  'admin.employeesServiceAssignmentHint':
    'Per ogni servizio scegli chi è prenotabile. Le modifiche vengono salvate subito.',
  'admin.employeesServiceAssignmentEmpty': 'Nessun servizio nel catalogo.',
  'admin.employeesServiceAssignmentNoEmployees': 'Nessun profilo attivo da assegnare.',
  'admin.employeesHoursTitle': 'Orari di lavoro',
  'admin.employeesHoursHint': 'Orari settimanali regolari. Giorno chiuso = nessun intervallo.',
  'admin.employeesDayExceptionTitle': 'Assenze',
  'admin.employeesDayExceptionHint':
    'Assenze personali (ferie, orari ridotti). Le chiusure del salone valgono già automaticamente.',
  'admin.employeesDayExceptionDate': 'Data (AAAA-MM-GG)',
  'admin.employeesDayExceptionAdd': 'Aggiungi assenza',
  'admin.employeesDayExceptionEdit': 'Modifica assenza',
  'admin.employeesDayExceptionEmpty': 'Nessuna assenza ancora.',
  'admin.employeesDayExceptionSave': 'Salva assenza',
  'admin.employeesDayExceptionDelete': 'Elimina assenza',
  'admin.employeesDayExceptionAllDay': 'Assente tutto il giorno',
  'admin.employeesDayExceptionPartial': 'Disponibile solo {hours}',
  'admin.employeesDayExceptionOpenThen': 'Quel giorno disponibile: {hours}',
  'admin.employeesDayExceptionAbsentThen': 'Quel giorno completamente assente.',
  'admin.employeesDayExceptionDefaultName': 'Assente',
  'admin.employeesBookablePreviewTitle': 'Proiezione prenotabile pubblica',
  'admin.employeesBookablePreviewHint':
    'Come gli stilisti compaiono nella prenotazione cliente (callable listBookableEmployees).',
  'admin.employeesBookablePreviewError': 'Impossibile caricare la proiezione.',
  'admin.employeesBookablePreviewEmpty': 'Nessun profilo prenotabile al momento.',
  'admin.employeesBookablePreviewServices': '{count} servizi',
  'admin.employeesSoftRemove': 'Rimuovi profilo',
  'admin.employeesRemoved': 'Rimosso',
  'admin.employeesError.firstNameInvalid': 'Inserisci un nome valido (max. 80 caratteri).',
  'admin.employeesError.lastNameInvalid': 'Inserisci un cognome valido (max. 80 caratteri).',
  'admin.employeesError.emailInvalid': 'Inserisci un indirizzo e-mail valido.',
  'admin.employeesError.passwordTooShort': 'La password deve avere almeno 8 caratteri.',
  'admin.employeesError.alreadyExists': 'Esiste già un profilo per questa persona.',
  'admin.employeesError.notFound': 'Profilo collaboratore non trovato.',
  'admin.employeesError.featureDisabled':
    'La gestione collaboratori non è attiva per questo salone.',
  'admin.employeesError.authDisabledBookable':
    'Un account disabilitato non può essere prenotabile. Riattiva prima il login.',
  'admin.employeesError.mustBeAdmin': 'Solo gli account admin possono essere collegati così.',
  'admin.employeesError.failed': 'Operazione non riuscita. Riprova.',
  'admin.primaryAdminBadge': 'Admin principale',
  'admin.accountDisplayName': 'Nome',
  'admin.accountEmail': 'E-mail',
  'admin.accountPassword': 'Password (min. 8 caratteri)',
  'admin.settingsSubtitle': 'Servizi, orari, prenotazione online e i contatti mostrati sul sito.',
  'admin.settingsLoading': 'Caricamento impostazioni',
  'admin.settingsError': 'Impossibile caricare le impostazioni.',
  'admin.confirmationMode': 'Nuove prenotazioni',
  'admin.slotInterval': 'Intervallo degli orari di inizio',
  'admin.minAdvance': 'Preavviso minimo',
  'admin.maxAdvance': 'Prenotabile al massimo con',
  'admin.pendingExpiration': 'Le richieste aperte scadono dopo',
  'admin.openingHours': 'Orari di apertura',
  'admin.openingHoursLoading': 'Caricamento…',
  'admin.openingHoursError': 'Impossibile caricare gli orari di apertura.',
  'admin.closed': 'Chiuso',
  'hours.title': 'Orari e assenze',
  'hours.subtitle':
    'I clienti non vedono nulla di tutto questo: negli orari di chiusura semplicemente non ci sono appuntamenti liberi.',
  'hours.weeklyTitle': 'Ogni settimana',
  'hours.weeklyHint': 'I tuoi orari normali. Con „Fascia“ puoi inserire ad es. una pausa pranzo.',
  'hours.open': 'Aperto',
  'hours.from': 'Dalle',
  'hours.to': 'Alle',
  'hours.addInterval': 'Fascia',
  'hours.removeInterval': 'Rimuovi fascia',
  'hours.copyToOpenDays': 'Applica a tutti i giorni aperti',
  'hours.copied': 'Applicato – ora salva.',
  'hours.intervalOrder': 'La fine deve essere dopo l’inizio.',
  'hours.intervalOverlap': 'Si sovrappone a un’altra fascia.',
  'hours.intervalInvalid': 'Inserisci un orario.',
  'hours.unsaved': 'Modifiche non salvate',
  'hours.absencesTitle': 'Assenze ed eccezioni',
  'hours.absencesHint':
    'Ferie, festività o una mattina chiusa – in questi orari nessuno può prenotare online.',
  'hours.addAbsence': 'Inserisci assenza',
  'hours.absencesEmpty': 'Nessuna assenza programmata.',
  'hours.absencesError': 'Impossibile caricare le assenze.',
  'hours.kindQuestion': 'Cosa vuoi inserire?',
  'hours.kindDays': 'Giorni interi',
  'hours.kindDaysHint': 'Ferie, festività, malattia',
  'hours.kindMorning': 'Mattina chiuso',
  'hours.kindMorningHint': 'Aperto solo dalle 12:00',
  'hours.kindAfternoon': 'Pomeriggio chiuso',
  'hours.kindAfternoonHint': 'Aperto solo fino alle 12:00',
  'hours.kindCustom': 'Altri orari',
  'hours.kindCustomHint': 'Orari speciali per un giorno',
  'hours.firstDay': 'Primo giorno',
  'hours.lastDay': 'Ultimo giorno',
  'hours.date': 'Data',
  'hours.note': 'Nota (facoltativa)',
  'hours.notePlaceholder': 'es. Ferie',
  'hours.defaultName': 'Chiuso',
  'hours.dayCount': 'Giorni: {count}',
  'hours.openThen': 'Aperto quel giorno: {hours}',
  'hours.closedThen': 'Quel giorno sarà chiuso tutto il giorno.',
  'hours.customHint': 'Orari solo per questo giorno:',
  'hours.conflicts':
    'Appuntamenti esistenti in questo periodo: {count}. Restano validi – se necessario annullali tu.',
  'hours.dateRequired': 'Scegli una data.',
  'hours.endBeforeStart': 'L’ultimo giorno è prima del primo.',
  'hours.tooLong': 'Al massimo un anno di seguito.',
  'hours.checkIntervals': 'Controlla gli orari.',
  'hours.submitAbsence': 'Inserisci',
  'hours.dialogCancel': 'Annulla',
  'hours.deleteAbsence': 'Elimina assenza',
  'hours.closedAllDay': 'Chiuso tutto il giorno',
  'hours.openOnly': 'Aperto solo {hours}',
  'admin.statPending': 'Richieste aperte',
  'admin.pendingEmpty': 'Nessuna richiesta aperta.',
  'admin.addReservation': 'Inserisci appuntamento',
  'admin.bookingRulesTitle': 'Prenotazione online',
  'admin.modeAutomatic': 'Conferma automatica',
  'admin.modeAutomaticHint': 'Gli orari liberi vengono prenotati subito.',
  'admin.modeManual': 'Confermo ogni richiesta',
  'admin.modeManualHint': 'L’orario resta riservato finché non lo confermate o rifiutate.',
  'admin.slotIntervalHint': 'Ogni quanti minuti può iniziare un appuntamento.',
  'admin.minAdvanceHint': 'Con quanto anticipo minimo si può prenotare online.',
  'admin.maxAdvanceHint': 'Fin dove il calendario di prenotazione mostra orari liberi.',
  'admin.pendingExpirationHint': 'Vale solo se confermate voi le richieste.',
  'admin.unitMinutes': 'minuti',
  'admin.unitDays': 'giorni',
  'admin.unitHours': 'ore',
  'admin.salonDetailsTitle': 'Salone e contatti',
  'admin.salonDetailsHint': 'Compare nella home e nel piè di pagina del sito.',
  'admin.fieldName': 'Nome del salone',
  'admin.fieldAddress': 'Indirizzo',
  'admin.fieldPhone': 'Telefono',
  'admin.fieldEmail': 'E-mail',
  'admin.fieldVatId': 'P. IVA (facoltativa)',
  'admin.save': 'Salva',
  'admin.saved': 'Salvato.',
  'admin.saveFailed': 'Salvataggio non riuscito: {message}',
  'admin.rangeError': 'Sono ammessi numeri interi da {min} a {max}.',
  'admin.requiredError': 'Campo obbligatorio.',
  'admin.emailError': 'Inserite un indirizzo e-mail valido.',
  'admin.tooLongError': 'Al massimo {max} caratteri.',
  'admin.weekNumber': 'Settimana {week}',
  'admin.prevWeek': 'Settimana precedente',
  'admin.nextWeek': 'Settimana successiva',
  'admin.thisWeek': 'Questa settimana',
  'admin.weekTotals': 'Totale della settimana',
  'admin.totalCount': 'Appuntamenti',
  'admin.totalTime': 'Tempo prenotato',
  'admin.totalRevenue': 'Fatturato',
  'admin.plannerLabel': 'Calendario settimanale',
  'admin.plannerLegend': 'Legenda',
  'admin.plannerDayFree': 'Ancora libero',
  'admin.plannerCount': '{count} appuntamenti',
  'admin.plannerCountOne': '1 appuntamento',
  'admin.viewLabel': 'Vista',
  'admin.viewWeek': 'Settimana',
  'admin.viewList': 'Elenco',
  'admin.salonAreas': 'Salone',
  'admin.servicesHint': 'Prezzi, durata e quali servizi si possono prenotare online.',
  'admin.backToSettings': 'Alle impostazioni',
  'admin.googleCalendarLegend': 'Google Calendar / Bloccato',
  'admin.googleCalendarEventFallback': 'Google Calendar',
  'admin.googleCalendarTitle': 'Google Calendar',
  'admin.googleCalendarHint':
    'Collega un calendario Google per bloccare automaticamente gli impegni esterni e sincronizzare le prenotazioni dei clienti.',
  'admin.googleCalendarNotConfigured':
    'Google Calendar OAuth non è ancora configurato sul server (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET).',
  'admin.googleCalendarConnect': 'Collega Google Calendar',
  'admin.googleCalendarConnectedAs': 'Collegato come {email}',
  'admin.googleCalendarConnectedBanner': 'Google Calendar collegato con successo.',
  'admin.googleCalendarErrorBanner': 'Collegamento a Google Calendar non riuscito. Riprova.',
  'admin.googleCalendarSelectLabel': 'Seleziona calendario',
  'admin.googleCalendarCustomIdLabel': 'Oppure inserisci ID calendario condiviso',
  'admin.googleCalendarUseId': 'Usa calendario',
  'admin.googleCalendarSyncNow': 'Sincronizza ora',
  'admin.googleCalendarSyncResult':
    'Sincronizzato: {blocked} eventi esterni, {pushed} prenotazioni inviate.',
  'admin.googleCalendarLastSync': 'Ultima sincronizzazione: {time}',
  'admin.googleCalendarDisconnect': 'Scollega',
  'book.employeeTitle': 'Scegli stilista',
  'book.employeeAny': 'Qualsiasi (primo orario disponibile)',
  'admin.employeeAll': 'Tutti i collaboratori',
  'admin.employeeSelectLabel': 'Calendario',
  'admin.googleCalendarForEmployee': 'Google Calendar per',
  'admin.googleCalendarSalonWide': 'Calendario del salone (Predefinito)',
}

export const catalogs: Record<'de' | 'it', Messages> = { de, it }

export function translate(
  locale: 'de' | 'it',
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text: string = catalogs[locale][key] ?? catalogs.de[key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}
