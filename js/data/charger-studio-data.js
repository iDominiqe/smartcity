/**
 * Localized copy, live Power Flow Sankey telemetry, exact 60 kW / 500V / 100 kWh Na-ion specs,
 * 4 camera presets, and 3D callouts for the
 * NEO® SafeCharge X1 — 500V 60kW Anti-Theft EV Fast Charger & 100 kWh Na-ion Energy Hub.
 */

export const CHARGER_STUDIO_TEXT = {
  en: {
    badge: 'NEO® SAFECHARGE X1 · PROTOTYPE · 60 KW 500V DC & 100 KWH NA-ION HUB',
    title: 'NEO® SafeCharge X1 — 60 kW 500V EV Charger & 100 kWh Na-ion Hub',
    subtitle: '0.8×1.0×1.90 m ventilated monolith · Motorized front-rail hatch · QR/PIN/RFID/OCPP · 5 m CCS2/GB-T',
    dragHint: '↻ Drag 360° · Scan QR for code 2026 · Charge · Return gun to auto-close (alarm if unreturned)',
    shareBtn: '🔗 Copy Link',
    shareCopied: '✓ Copied!',
    closeBtn: '✕ Close Studio',
    requestQuote: 'Request SafeCharge X1 Quote',
    camOverview: 'Hero Front View',
    camDoor: 'Access Panel & QR',
    camNaion: 'Internal X-Ray',
    camRenew: 'Microgrid Overview',
    autoSpin: '↻ 360° Spin',
    xrayBtn: '🔍 X-Ray / Internal',
    qrScanBtn: '📱 Scan QR (Get Code)',
    pinPlaceholder: 'PIN 2026',
    pinUnlockBtn: '🔓 Unlock',
    lockBtn: '🔒 Close Hatch',
    connectEvBtn: '🔌 Connect & Charge EV',
    disconnectEvBtn: '↩️ Return Gun & Close',
    partialBtn: '🟠 ≥40 kWh Mode',
    tamperBtn: '🚨 Alarm / Theft Test',
    gridBackupBtn: '⚡ EDF Night Boost 60kW',
    autoTimePlayBtn: '▶ Auto 0–23h',
    autoTimePauseBtn: '⏸ Pause 0–23h',
    timeLabel: 'Time of Day',
    telemetrySolarWind: 'Energy Input (Day/Night)',
    telemetryGrid: 'EDF Energy (230/380V)',
    telemetryNaion: 'Na-ion SoC (100 kWh)',
    telemetryEv: 'EV Charge (500 Vdc)',
    telemetryDoor: 'Hatch & Lamp Status',
    legendRenew: 'Solar 800Vdc & Wind',
    legendNaion: '100 kWh Na-ion',
    legendEv: '500 Vdc / 60 kW EV',
    legendGrid: 'EDF Energy -> Station',
    doorLockedTxt: 'CLOSED · GREEN LAMP',
    doorPartialTxt: 'PARTIAL ≥40 KWH · ORANGE',
    doorUnlockedTxt: 'HATCH OPEN · CODE 2026',
    doorChargingTxt: 'CHARGING · 60 KW 500V',
    doorAlarmTxt: 'UNAVAILABLE · RED LAMP',
    tamperAlertTxt: '🚨 TAMPER / UNAVAILABLE · RED STROBE LAMP & SIREN ACTIVE',
    gunNotReturnedTxt: '🚨 ALARM: GUN NOT RETURNED TO HOLSTER! RETURN CONNECTOR TO CLOSE HATCH',
    qrCodeIssuedTxt: '📱 QR SCANNED · UNLOCK CODE 2026 ISSUED -> HATCH SLIDING OPEN ON FRONT RAIL',
    partialModeTxt: '🟠 PARTIAL AVAILABILITY · NA-ION AT 48 KWH (≥40 KWH CHARGEABLE) · ORANGE TOP LAMP',
    modeStatusDay: '☀️ DAY (06:00–19:00) · SOLAR PANELS + WIND TURBINE CHARGE STATION & EV (EDF ENERGY GRID OFF)',
    modeStatusNightBat: '🌙 NIGHT (19:00–06:00) · EDF ENERGY POLE -> EDF BOX -> CHARGES STATION (100 KWH NA-ION) -> EV',
    modeStatusNightGrid: '⚡ NIGHT EDF BOOST · EDF ENERGY 230/380V (60 KW) -> CHARGES STATION & NA-ION -> FAST CHARGES EV'
  },
  fr: {
    badge: 'NEO® SAFECHARGE X1 · PROTOTYPE · BORNE 60 KW 500VDC & NA-ION 100 KWH',
    title: 'NEO® SafeCharge X1 — Borne Publique 60 kW 500V & Stockage Na-ion 100 kWh',
    subtitle: '0,8×1,0×1,90 m ventilée coins arrondis · Trappe motorisée glissante · QR/Code/RFID/OCPP · Câble 5 m',
    dragHint: '↻ Glissez 360° · Scannez le QR (code 2026) · Chargez · Reposez le pistolet pour refermer',
    shareBtn: '🔗 Copier le lien',
    shareCopied: '✓ Lien copié !',
    closeBtn: '✕ Fermer le Studio',
    requestQuote: 'Devis SafeCharge X1',
    camOverview: 'Vue Façade Héro',
    camDoor: 'Panneau QR & Code',
    camNaion: 'Rayon-X Interne',
    camRenew: 'Vue Micro-Réseau',
    autoSpin: '↻ Rotation 360°',
    xrayBtn: '🔍 Rayon-X Interne',
    qrScanBtn: '📱 Scanner QR (Code)',
    pinPlaceholder: 'Code 2026',
    pinUnlockBtn: '🔓 Ouvrir',
    lockBtn: '🔒 Fermer Trappe',
    connectEvBtn: '🔌 Charger le VE',
    disconnectEvBtn: '↩️ Reposer & Fermer',
    partialBtn: '🟠 Dispo ≥40 kWh',
    tamperBtn: '🚨 Test Alarme / Vol',
    gridBackupBtn: '⚡ Boost EDF Nuit 60kW',
    autoTimePlayBtn: '▶ Auto 0–23h',
    autoTimePauseBtn: '⏸ Pause 0–23h',
    timeLabel: 'Heure du Jour',
    telemetrySolarWind: 'Source (Jour/Nuit)',
    telemetryGrid: 'EDF Energy (230/380V)',
    telemetryNaion: 'Na-ion SoC (100 kWh)',
    telemetryEv: 'Sortie VE (500 Vdc)',
    telemetryDoor: 'Trappe & Lampe Haut',
    legendRenew: 'Solaire 800Vdc & Éolien',
    legendNaion: 'Na-ion 100 kWh',
    legendEv: 'Sortie 500 Vdc / 60 kW',
    legendGrid: 'EDF Energy -> Borne',
    doorLockedTxt: 'FERMÉE · LAMPE VERTE',
    doorPartialTxt: 'PARTIEL ≥40 KWH · ORANGE',
    doorUnlockedTxt: 'TRAPPE OUVERTE · CODE 2026',
    doorChargingTxt: 'EN CHARGE · 60 KW 500V',
    doorAlarmTxt: 'INDISPONIBLE · LAMPE ROUGE',
    tamperAlertTxt: '🚨 INDISPONIBLE / EFFRACTION · LAMPE ROUGE CLIGNOTANTE & SIRÈNE ACTIVE',
    gunNotReturnedTxt: '🚨 ALARME NON-REPOSE PISTOLET · REMETTEZ LA PRISE POUR REFERMER LA TRAPPE',
    qrCodeIssuedTxt: '📱 QR SCANNÉ · CODE D’OUVERTURE 2026 REÇU -> GLISSEMENT DE LA TRAPPE MOTORISÉE',
    partialModeTxt: '🟠 DISPONIBILITÉ PARTIELLE · 48 KWH DISPONIBLES (≥40 KWH) · LAMPE ORANGE EN HAUT',
    modeStatusDay: '☀️ JOUR (06h–19h) · SOLAIRE 800V + ÉOLIEN RECHARGENT LA BORNE & VE (EDF OFF)',
    modeStatusNightBat: '🌙 NUIT (19h–06h) · POTEAU EDF ENERGY -> POSTE -> RECHARGE LA BORNE (NA-ION 100 KWH) -> VE',
    modeStatusNightGrid: '⚡ NUIT BOOST EDF · EDF ENERGY 230/380V (60 KW) -> CHARGE BORNE & NA-ION -> VE'
  },
  bg: {
    badge: 'NEO® SAFECHARGE X1 · ПРОТОТИП · 60 KW 500V DC & 100 KWH NA-ION ХЪБ',
    title: 'NEO® SafeCharge X1 — Бърза Станция 60 kW 500V & 100 kWh Na-ion Батерия',
    subtitle: '0.8×1.0×1.90 м вентилиран корпус · Плъзгаща моторизирана врата · QR/PIN/RFID/OCPP · Кабел 5 м',
    dragHint: '↻ Въртете 360° · Сканирайте QR (код 2026) · Заредете · Върнете пистолета за затваряне',
    shareBtn: '🔗 Копирай линк',
    shareCopied: '✓ Копирано!',
    closeBtn: '✕ Затвори Студиото',
    requestQuote: 'Оферта SafeCharge X1',
    camOverview: 'Преден Изглед',
    camDoor: 'QR & PIN Панел',
    camNaion: 'Вътрешен Разрез',
    camRenew: 'Микромрежа 3D',
    autoSpin: '↻ 360° Въртене',
    xrayBtn: '🔍 X-Ray Разрез',
    qrScanBtn: '📱 Сканирай QR (Код)',
    pinPlaceholder: 'PIN 2026',
    pinUnlockBtn: '🔓 Отключи',
    lockBtn: '🔒 Затвори',
    connectEvBtn: '🔌 Свържи и Зареди',
    disconnectEvBtn: '↩️ Върни Пистолета',
    partialBtn: '🟠 Режим ≥40 kWh',
    tamperBtn: '🚨 Аларма / Кражба',
    gridBackupBtn: '⚡ EDF Нощен Буст 60kW',
    autoTimePlayBtn: '▶ Авто 0–23ч',
    autoTimePauseBtn: '⏸ Пауза 0–23ч',
    timeLabel: 'Час на Денонощието',
    telemetrySolarWind: 'Вход (Ден/Нощ)',
    telemetryGrid: 'EDF Energy (230/380V)',
    telemetryNaion: 'Na-ion (100 kWh)',
    telemetryEv: 'Заряд ЕМ (500 Vdc)',
    telemetryDoor: 'Люк & Горна Лампа',
    legendRenew: 'Солар 800Vdc и Вятър',
    legendNaion: 'Na-ion 100 kWh',
    legendEv: '500 Vdc / 60 kW ЕМ',
    legendGrid: 'EDF Energy -> Станция',
    doorLockedTxt: 'ЗАТВОРЕНА · ЗЕЛЕНА ЛАМПА',
    doorPartialTxt: 'ЧАСТИЧНА ≥40 KWH · ОРАНЖЕВА',
    doorUnlockedTxt: 'ОТВОРЕНА · КОД 2026',
    doorChargingTxt: 'ЗАРЕЖДА · 60 KW 500V',
    doorAlarmTxt: 'НЕДОСТЪПНА · ЧЕРВЕНА ЛАМПА',
    tamperAlertTxt: '🚨 НЕДОСТЪПНА / АЛАРМА · ЧЕРВЕНА ЛАМПА И СИРЕНА АКТИВНИ',
    gunNotReturnedTxt: '🚨 АЛАРМА: ПИСТОЛЕТЪТ НЕ Е ВЪРНАТ НА МЯСТО! ВЪРНЕТЕ ГО, ЗА ДА СЕ ЗАТВОРИ',
    qrCodeIssuedTxt: '📱 QR СКАНИРАН · КОД 2026 -> МОТОРИЗИРАНИЯТ ЛЮК СЕ ПЛЪЗГА ОТПРЕД',
    partialModeTxt: '🟠 ЧАСТИЧНА НАЛИЧНОСТ · 48 KWH (≥40 KWH ГОТОВНОСТ) · ОРАНЖЕВА ЛАМПА',
    modeStatusDay: '☀️ ДЕН (06–19ч) · СОЛАР + ВЯТЪР ЗАРЕЖДАТ СТАНЦИЯТА И ЕМ (EDF МРЕЖА ИЗКЛ.)',
    modeStatusNightBat: '🌙 НОЩ (19–06ч) · СТЪЛБ EDF ENERGY -> ТРАФОПОСТ -> ЗАРЕЖДА СТАНЦИЯТА (NA-ION) -> ЕМ',
    modeStatusNightGrid: '⚡ НОЩ EDF БУСТ · EDF ENERGY 230/380V (60 KW) -> ЗАРЕЖДА СТАНЦИЯТА И NA-ION -> ЕМ'
  },
  ro: {
    badge: 'NEO® SAFECHARGE X1 · PROTOTIP · STAȚIE 60 KW 500VDC & NA-ION 100 KWH',
    title: 'NEO® SafeCharge X1 — Stație Publică 60 kW 500V & Stocare Na-ion 100 kWh',
    subtitle: '0.8×1.0×1.90 m ventilată colțuri rotunjite · Trapă glisantă motorizată · QR/PIN/RFID/OCPP · Cablu 5 m',
    dragHint: '↻ Rotiți 360° · Scanați QR (cod 2026) · Încărcați · Puneți pistolul la loc pentru închidere',
    shareBtn: '🔗 Copiază link',
    shareCopied: '✓ Copiat!',
    closeBtn: '✕ Închide Studioul',
    requestQuote: 'Solicită Ofertă X1',
    camOverview: 'Vedere Frontală',
    camDoor: 'Panou QR & PIN',
    camNaion: 'X-Ray Intern',
    camRenew: 'Microrețea 3D',
    autoSpin: '↻ Rotire 360°',
    xrayBtn: '🔍 X-Ray Intern',
    qrScanBtn: '📱 Scanează QR (Cod)',
    pinPlaceholder: 'PIN 2026',
    pinUnlockBtn: '🔓 Deschide',
    lockBtn: '🔒 Închide Trapa',
    connectEvBtn: '🔌 Încarcă EV',
    disconnectEvBtn: '↩️ Pune Pistolul & Închide',
    partialBtn: '🟠 Mod ≥40 kWh',
    tamperBtn: '🚨 Test Alarmă / Furt',
    gridBackupBtn: '⚡ Boost EDF Noapte 60kW',
    autoTimePlayBtn: '▶ Auto 0–23h',
    autoTimePauseBtn: '⏸ Pauză 0–23h',
    timeLabel: 'Ora Zilei',
    telemetrySolarWind: 'Sursă (Zi/Noapte)',
    telemetryGrid: 'EDF Energy (230/380V)',
    telemetryNaion: 'SoC Na-ion (100 kWh)',
    telemetryEv: 'Ieșire EV (500 Vdc)',
    telemetryDoor: 'Trapă & Lampă Sus',
    legendRenew: 'Solar 800Vdc & Eolian',
    legendNaion: 'Na-ion 100 kWh',
    legendEv: '500 Vdc / 60 kW EV',
    legendGrid: 'EDF Energy -> Stație',
    doorLockedTxt: 'ÎNCHISĂ · LAMPĂ VERDE',
    doorPartialTxt: 'PARȚIAL ≥40 KWH · PORTOCALIU',
    doorUnlockedTxt: 'DESCHISĂ · COD 2026',
    doorChargingTxt: 'ÎNCARCĂ · 60 KW 500V',
    doorAlarmTxt: 'INDISPONIBIL · LAMPĂ ROȘIE',
    tamperAlertTxt: '🚨 INDISPONIBIL / EFRACȚIE · LAMPĂ ROȘIE & SIRENĂ ACTIVĂ',
    gunNotReturnedTxt: '🚨 ALARMĂ: PISTOL NERETURNAT! PUNEȚI CONECTORUL LA LOC PENTRU A ÎNCHIDE TRAPA',
    qrCodeIssuedTxt: '📱 QR SCANAT · COD 2026 EMIS -> TRAPA GLISEAZĂ PE ȘINA FRONTALĂ',
    partialModeTxt: '🟠 DISPONIBILITATE PARȚIALĂ · 48 KWH (≥40 KWH) · LAMPĂ PORTOCALIE',
    modeStatusDay: '☀️ ZIUA (06–19h) · SOLAR + EOLIAN ÎNCARCĂ STAȚIA ȘI EV (REȚEA EDF OPRITĂ)',
    modeStatusNightBat: '🌙 NOAPTEA (19–06h) · STÂLP EDF ENERGY -> POST -> ÎNCARCĂ STAȚIA (NA-ION 100 KWH) -> EV',
    modeStatusNightGrid: '⚡ NOAPTEA BOOST EDF · EDF ENERGY 230/380V (60 KW) -> ÎNCARCĂ STAȚIA & NA-ION -> EV'
  }
};

export const CHARGER_LEFT_SPECS = [
  {
    id: 'fastCharge',
    icon: '⚡',
    focusCam: 'ev',
    label: { en: 'OUTPUT 60 KW · 500 VDC', fr: 'SORTIE 60 KW · 500 VDC', bg: 'ИЗХОД 60 KW · 500 VDC', ro: 'IEȘIRE 60 KW · 500 VDC' },
    value: 'CCS1/CCS2 · GB/T Type C',
    detail: {
      en: 'Single connector 60 kW max at 500 Vdc · 5 m cable (customizable) · Energy meter · Reg. ≤±1% (I) / ≤0.5% (V)',
      fr: 'Connecteur unique 60 kW max à 500 Vdc · Câble 5 m (personnalisable) · Compteur d’énergie · Précision ≤±1% / ≤0,5%',
      bg: 'Един конектор 60 kW при 500 Vdc · Кабел 5 м · Електромер · Точност ≤±1% (ток) / ≤0.5% (напрежение)',
      ro: 'Conector unic 60 kW la 500 Vdc · Cablu 5 m · Contor energie · Precizie ≤±1% (I) / ≤0,5% (V)'
    }
  },
  {
    id: 'naion',
    icon: '🔋',
    focusCam: 'naion',
    label: { en: 'NA-ION 100 KWH & INPUTS', fr: 'NA-ION 100 KWH & ENTRÉES', bg: 'NA-ION 100 KWH И ВХОД', ro: 'NA-ION 100 KWH & INTRĂRI' },
    value: 'AC 230/380V · Solar 800Vdc',
    detail: {
      en: '100 kWh Sodium-Ion battery · AC input 230/380 Vac ±20% · Solar DC input 800 Vdc · ≥40 kWh partial reserve',
      fr: 'Batterie Sodium-Ion 100 kWh · Entrée AC 230/380 Vac ±20% · Entrée DC solaire 800 Vdc · Mode partiel ≥40 kWh',
      bg: '100 kWh Na-ion батерия · AC вход 230/380 Vac ±20% · Соларен DC вход 800 Vdc · Частичен режим ≥40 kWh',
      ro: 'Baterie Sodiu-Ion 100 kWh · Intrare AC 230/380 Vac ±20% · Intrare DC solar 800 Vdc · Mod parțial ≥40 kWh'
    }
  },
  {
    id: 'antiTheft',
    icon: '🔐',
    focusCam: 'door',
    label: { en: 'SLIDING HATCH & OCPP', fr: 'TRAPPE MOTORISÉE & OCPP', bg: 'ПЛЪЗГАЩ ЛЮК И OCPP', ro: 'TRAPĂ GLISANTĂ & OCPP' },
    value: 'QR · PIN · RFID · POS · 4G/RJ45',
    detail: {
      en: 'Scan QR -> receive unlock code -> motorized slide open -> charge -> return gun -> auto-close (non-return alarm)',
      fr: 'Scan QR -> code d’ouverture -> glissement motorisé -> charge -> repose pistolet -> fermeture auto (alarme non-repose)',
      bg: 'QR скан -> код за отваряне -> плъзгане -> заряд -> връщане на пистолета -> авто-затваряне (аларма при невръщане)',
      ro: 'Scan QR -> cod deschidere -> glisare motorizată -> încărcare -> repunere pistol -> închidere auto (alarmă nereturnare)'
    }
  },
  {
    id: 'chassis',
    icon: '📐',
    focusCam: 'overview',
    label: { en: 'DIMENSIONS & STATUS LAMP', fr: 'TAILLE & LAMPE STATUT', bg: 'РАЗМЕРИ И СТАТУС ЛАМПА', ro: 'DIMENSIUNI & LAMPĂ STATUT' },
    value: '0.8 × 1.0 × 1.90 m · <75 dB',
    detail: {
      en: '1.0 m depth × 0.8 m width × 1.90 m height, ventilated rounded corners · Top lamp: Green / Orange (≥40 kWh) / Red',
      fr: '1 m prof. × 0,8 m larg. × 1,90 m haut., ventilée coins arrondis · Lampe haut : Vert / Orange (≥40 kWh) / Rouge',
      bg: '1.0 м дълбочина × 0.8 м ширина × 1.90 м височина, вентилирана · Лампа: Зелено / Оранжево (≥40 kWh) / Червено',
      ro: '1.0 m adâncime × 0.8 m lățime × 1.90 m înălțime, ventilată · Lampă sus: Verde / Portocaliu (≥40 kWh) / Roșu'
    }
  }
];

export const CHARGER_RIGHT_SPECS = [
  {
    id: 'protection',
    icon: '🛡️',
    focusCam: 'naion',
    label: { en: 'PROTECTION & DIELECTRIC', fr: 'PROTECTIONS & DIÉLECTRIQUE', bg: 'ЗАЩИТИ И ДИЕЛЕКТРИК', ro: 'PROTECȚII & DIELECTRIC' },
    value: '≥ 2000 V · Error ≤±1% / 0.5%',
    detail: {
      en: 'Over/under-voltage, short-circuit, overload, leakage & surge protection · Output error ≤±1% (I) / ≤±0.5% (V)',
      fr: 'Surtension/sous-tension, court-circuit, surcharge, fuite et surtensions · Erreur sortie ≤±1% (I) / ≤±0,5% (V)',
      bg: 'Защита от пренапрежение, късо съединение, претоварване, утечка · Грешка ≤±1% (ток) / ≤±0.5% (напрежение)',
      ro: 'Protecție supra/sub-tensiune, scurtcircuit, suprasarcină, scurgeri · Eroare ieșire ≤±1% (I) / ≤±0,5% (V)'
    }
  },
  {
    id: 'reliability',
    icon: '🌡️',
    focusCam: 'overview',
    label: { en: 'RELIABILITY & CLIMATE', fr: 'FIABILITÉ & TEMPÉRATURE', bg: 'НАДЕЖДНОСТ И КЛИМАТ', ro: 'FIABILITATE & CLIMAT' },
    value: '100,000 h · -20 ~ +50 °C',
    detail: {
      en: '100,000 h MTBF reliability · Operating temp -20 ~ +50 °C · Storage temp -20 ~ +70 °C · Noise < 75 dB',
      fr: 'Fiabilité 100 000 h · Fonctionnement -20 ~ +50 °C · Stockage -20 ~ +70 °C · Bruit < 75 dB',
      bg: 'Надеждност 100 000 ч · Работна темп. -20 ~ +50 °C · Съхранение -20 ~ +70 °C · Шум < 75 dB',
      ro: 'Fiabilitate 100.000 h · Funcționare -20 ~ +50 °C · Stocare -20 ~ +70 °C · Zgomot < 75 dB'
    }
  },
  {
    id: 'daySolarWind',
    icon: '☀️',
    focusCam: 'renew',
    label: { en: 'DAY (06:00–19:00) GREEN', fr: 'JOUR (06h–19h) SOLAIRE', bg: 'ДЕН (06:00–19:00) ЗЕЛЕНО', ro: 'ZI (06:00–19:00) VERDE' },
    value: 'Solar 800Vdc + VAWT Wind',
    detail: {
      en: 'Solar array (800 Vdc) + vertical-axis wind turbine feed MPPT -> EV (60 kW) and excess into 100 kWh Na-ion',
      fr: 'Panneaux solaires (800 Vdc) + éolienne VAWT alimentent MPPT -> VE (60 kW) et surplus vers Na-ion 100 kWh',
      bg: 'Соларни панели (800 Vdc) + вятърна турбина захранват MPPT -> ЕМ (60 kW) и Na-ion буфера',
      ro: 'Panouri solare (800 Vdc) + turbină eoliană alimentează MPPT -> EV (60 kW) și surplusul spre Na-ion 100 kWh'
    }
  },
  {
    id: 'nightMode',
    icon: '🌙',
    focusCam: 'grid',
    label: { en: 'NIGHT: EDF ENERGY -> STATION', fr: 'NUIT : EDF ENERGY -> BORNE', bg: 'НОЩ: EDF ENERGY -> СТАНЦИЯ', ro: 'NOAPTE: EDF ENERGY -> STAȚIE' },
    value: 'Pole -> EDF Box -> Station',
    detail: {
      en: 'At night, EDF Energy transmission pole feeds the EDF box, which charges the SafeCharge X1 station (100 kWh Na-ion) -> station charges EV',
      fr: 'La nuit, le poteau EDF Energy alimente le poste EDF qui recharge la borne SafeCharge X1 (Na-ion 100 kWh) -> la borne charge le VE',
      bg: 'Нощем стълбът на EDF Energy захранва таблото EDF, което зарежда станцията (100 kWh Na-ion), а тя зарежда автомобила',
      ro: 'Noaptea stâlpul EDF Energy alimentează postul EDF care încarcă stația SafeCharge X1 (100 kWh Na-ion) -> stația încarcă EV'
    }
  }
];

export const CHARGER_CAMERA_PRESETS = {
  overview: { pos: [-5.8, 3.6, 8.6], target: [0.3, 1.45, -0.2] },
  door: { pos: [0.35, 1.6, 3.35], target: [0.0, 1.5, 0.25] },
  naion: { pos: [2.8, 1.85, -3.1], target: [0.0, 1.35, -0.1] },
  renew: { pos: [-7.6, 5.0, 6.2], target: [-2.2, 2.2, -1.6] },
  grid: { pos: [4.8, 3.2, 4.2], target: [1.5, 1.2, -2.2] }
};

export const CHARGER_HOTSPOTS = [
  {
    id: 'door',
    pos: [-0.15, 1.75, 0.54],
    focusCam: 'door',
    title: { en: 'Front-Rail Sliding Hatch', fr: 'Trappe Glissante QR/PIN', bg: 'Плъзгащ Люк QR/PIN', ro: 'Trapă Glisantă QR/PIN' },
    sub: { en: 'QR -> CODE 2026 · NON-RETURN ALARM', fr: 'QR -> CODE 2026 · ALARME REPOSE', bg: 'QR -> КОД 2026 · АЛАРМА', ro: 'QR -> COD 2026 · ALARMĂ' }
  },
  {
    id: 'naion',
    pos: [0.0, 1.15, -0.52],
    focusCam: 'naion',
    title: { en: '100 kWh Na-ion + SiC', fr: 'Na-ion 100 kWh + SiC', bg: '100 kWh Na-ion + SiC', ro: 'Na-ion 100 kWh + SiC' },
    sub: { en: '500 VDC 60 KW · X-RAY VIEW', fr: '500 VDC 60 KW · RAYON-X', bg: '500 VDC 60 KW · X-RAY', ro: '500 VDC 60 KW · X-RAY' }
  },
  {
    id: 'ev',
    pos: [2.85, 1.25, 0.55],
    focusCam: 'overview',
    title: { en: 'CCS2 / GB-T 5 m Cable', fr: 'Câble 5 m CCS2 / GB-T', bg: 'Кабел 5 м CCS2 / GB-T', ro: 'Cablu 5 m CCS2 / GB-T' },
    sub: { en: '500 VDC · 60 KW FAST CHARGE', fr: 'CHARGE RAPIDE 500 VDC 60 KW', bg: 'БЪРЗ ЗАРЯД 500 VDC 60 KW', ro: 'ÎNCĂRCARE 500 VDC 60 KW' }
  },
  {
    id: 'renew',
    pos: [-3.12, 1.85, -2.85],
    focusCam: 'renew',
    title: { en: 'Solar 800Vdc + Wind', fr: 'Solaire 800Vdc + Éolien', bg: 'Солар 800Vdc + Вятър', ro: 'Solar 800Vdc + Eolian' },
    sub: { en: 'DAY DIRECT MPPT INPUT', fr: 'ENTRÉE MPPT 800 VDC JOUR', bg: 'ДНЕВЕН MPPT 800 VDC', ro: 'INTRARE MPPT 800 VDC' }
  },
  {
    id: 'grid',
    pos: [2.1, 2.05, -3.6],
    focusCam: 'grid',
    title: {
      en: 'EDF Energy — Grid Box & Pole',
      fr: 'EDF Energy — Poste & Poteau',
      bg: 'EDF Energy — Трафопост и Стълб',
      ro: 'EDF Energy — Post & Stâlp'
    },
    sub: {
      en: 'POLE -> EDF BOX -> CHARGES STATION (NIGHT)',
      fr: 'POTEAU -> POSTE EDF -> CHARGE BORNE (NUIT)',
      bg: 'СТЪЛБ -> ТАБЛО EDF -> ЗАРЕЖДА СТАНЦИЯТА (НОЩ)',
      ro: 'STÂLP -> POST EDF -> ÎNCARCĂ STAȚIA (NOAPTE)'
    }
  }
];
