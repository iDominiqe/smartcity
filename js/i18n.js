/**
 * Multilingual localization module for Smart-City-Led.com
 * Supported languages: English (en), Français (fr), Български (bg), Română (ro)
 */

export const SUPPORTED_LANGS = ['en', 'fr', 'bg', 'ro'];

export const TRANSLATIONS = {
  en: {
    metaTitle: 'Smart-City-Led.com — 3D Solar Smart City & EV Ecosystem',
    brandTag: 'SOLAR · LED · EV',
    navCity: 'Mini-City',
    navCharging: 'EV Station',
    navHome: 'Evening Home',
    navCalc: 'Calculator',
    navSolutions: 'Solutions',

    hudTimeLabel: 'Simulation Time',
    hudSolarLabel: 'Solar Output',
    hudEvLabel: 'EV Battery',
    hudGridLabel: 'Grid Mode',

    modeStory: 'Story Scroll',
    modeOrbit: 'Free 3D Orbit',
    btnFlowBoost: 'Energy Flow: Normal',
    btnFlowBoostActive: 'Energy Flow: Boosted',
    btnDayNight: 'Day / Night Preview',
    orbitHint: 'Drag to rotate · Scroll to zoom · Right-click to pan',

    scrollPrompt: 'Scroll down to guide the solar energy journey',

    stage1Badge: 'STAGE 01 · DAYLIGHT SOLAR MICROGRID',
    stage1Title: 'Solar Panels Powering the Entire Mini-City',
    stage1Desc:
      'High-efficiency photovoltaic arrays and smart sun-tracking rooftop panels capture peak midday radiation. Clean DC power flows straight into the Central Battery Hub and energizes urban towers, parks, and adaptive LED infrastructure.',
    stage1Stat1Label: 'Grid Autonomy',
    stage1Stat1Val: '96.4%',
    stage1Stat2Label: 'LED Efficiency',
    stage1Stat2Val: '+68%',
    stage1Stat3Label: 'CO₂ Offset',
    stage1Stat3Val: '42.8 t/day',

    stage2Badge: 'STAGE 02 · SOLAR EV SUPERCHARGING',
    stage2Title: 'Electric Car Arrives at the Solar Charging Hub',
    stage2Desc:
      'Follow the smart boulevard as the electric vehicle pulls into the cantilevered solar canopy station. Concentrated photovoltaic energy streams directly from the station roof into the charging pedestal and rapidly tops up the EV battery with zero fossil grid draw.',
    stage2Stat1Label: 'Canopy Peak',
    stage2Stat1Val: '180 kW',
    stage2Stat2Label: 'Charge Speed',
    stage2Stat2Val: '22% → 100%',
    stage2Stat3Label: 'Clean Origin',
    stage2Stat3Val: '100% Solar',

    stage3Badge: 'STAGE 03 · EVENING RETURN & HOME STORAGE',
    stage3Title: 'Dusk Falls: Home Powered by Stored Solar Energy',
    stage3Desc:
      'As sunset turns into deep evening, Smart-City-Led streetlamps and vehicle headlights automatically illuminate. The EV glides smoothly into the residential driveway while stored rooftop solar batteries and Vehicle-to-Home (V2H) power keep the villa warm and glowing.',
    stage3Stat1Label: 'Wall Battery',
    stage3Stat1Val: '28.5 kWh',
    stage3Stat2Label: 'V2H Backup',
    stage3Stat2Val: 'Active',
    stage3Stat3Label: 'Smart LEDs',
    stage3Stat3Val: 'Auto-Dim',

    stage4Badge: 'STAGE 04 · NEO CLIM® AT SMART-CITY-LED.COM STORE',
    stage4Title: 'Drive to Smart-City-Led.com Store for NEO Clim® Solar AC',
    stage4Desc:
      'From the powered Smart Home, the EV cruises across the lit boulevard into the illuminated Smart-City-Led.com · NEO CLIM® Flagship Store pickup bay. Discover A+++ solar reversible air conditioning, mobile rentals, and ZEPHYR cooling with icy-cyan solar power.',
    stage4Stat1Label: 'Solar HVAC',
    stage4Stat1Val: 'Inverter A+++',
    stage4Stat2Label: 'Energy Savings',
    stage4Stat2Val: '-80% to -90%',
    stage4Stat3Label: 'ZEPHYR Cooler',
    stage4Stat3Val: '-5° to -15°C',
    btnOpenNeoClim: 'Explore NEO Clim®',
    btnOpenZephyr: 'ZEPHYR Sun Cooler®',
    btnExplore3d: 'Enter Free 3D Orbit',
    btnBackTop: 'Replay Journey',

    calcSectionBadge: 'INTERACTIVE ROI ESTIMATOR',
    calcSectionTitle: 'Solar & Smart LED Savings Calculator',
    calcSectionSubtitle:
      'Estimate annual clean energy generation, LED lighting savings, and EV charging autonomy for your building or municipality.',
    calcRoofLabel: 'Solar Roof Area (m²)',
    calcPolesLabel: 'Smart LED Streetlights',
    calcEvLabel: 'EV Daily Commute (km)',
    calcSunLabel: 'Region Solar Profile',
    calcSunSouth: 'Southern Europe / High Sun (1,650 kWh/kWp)',
    calcSunCentral: 'Central / Eastern Europe (1,320 kWh/kWp)',
    calcSunNorth: 'Northern Europe (1,050 kWh/kWp)',
    calcOutSolar: 'Annual Solar Generation',
    calcOutSavings: 'Estimated Annual Savings',
    calcOutCo2: 'CO₂ Emissions Prevented',
    calcOutEvKm: 'Free Solar EV Range / Year',

    solSectionBadge: 'SMART-CITY-LED.COM ARCHITECTURE',
    solSectionTitle: 'Integrated Hardware & Grid Intelligence',
    sol1Title: 'Bifacial Solar Microgrids',
    sol1Desc:
      'High-yield rooftop and ground-mount photovoltaic arrays paired with real-time MPPT inverters and district lithium-iron-phosphate storage hubs.',
    sol2Title: 'Adaptive Smart LED Poles',
    sol2Desc:
      'Motion-aware, twilight-calibrated LED street luminaires with integrated solar top-caps and IoT telemetry that reduce municipal lighting consumption by up to 72%.',
    sol3Title: 'Solar EV Canopies & V2H',
    sol3Desc:
      'Modular solar carports delivering fast DC charging during peak daylight and bidirectional Vehicle-to-Home energy sharing throughout the evening.',

    footerTagline: 'Designing clean solar microgrids, adaptive Smart LED streetscapes, and autonomous EV ecosystems across Europe.',
    footerDomain: 'Smart-City-Led.com · GitHub Pages Ready Static 3D Experience',
    footerBackTop: 'Back to Top ↑',

    // Dynamic telemetry status values
    gridDayCity: 'Solar Peak → City',
    gridCharging: 'Canopy → EV Fast Charge',
    gridEveningDrive: 'Dusk Transition · LEDs On',
    gridEveningHome: 'Battery + V2H → Home',
    gridDriveToStore: 'Home → NEO Clim® Store',
    gridNeoClimStore: 'Smart-City-Led.com · NEO Clim® Pickup',
    gridNightEco: 'Night Storage Autonomous'
  },

  fr: {
    metaTitle: 'Smart-City-Led.com — Ville Solaire 3D & Écosystème VE',
    brandTag: 'SOLAIRE · LED · VE',
    navCity: 'Mini-Ville',
    navCharging: 'Station VE',
    navHome: 'Maison du Soir',
    navCalc: 'Calculateur',
    navSolutions: 'Solutions',

    hudTimeLabel: 'Heure Simulée',
    hudSolarLabel: 'Prod. Solaire',
    hudEvLabel: 'Batterie VE',
    hudGridLabel: 'Mode Réseau',

    modeStory: 'Défilement Guidé',
    modeOrbit: 'Orbite 3D Libre',
    btnFlowBoost: 'Flux Énergie : Normal',
    btnFlowBoostActive: 'Flux Énergie : Boost',
    btnDayNight: 'Aperçu Jour / Nuit',
    orbitHint: 'Glisser pour pivoter · Molette pour zoomer · Clic droit pour déplacer',

    scrollPrompt: 'Faites défiler vers le bas pour suivre le parcours solaire',

    stage1Badge: 'ÉTAPE 01 · MICRO-RÉSEAU SOLAIRE DE JOUR',
    stage1Title: 'Les Panneaux Solaires Alimentent Toute la Mini-Ville',
    stage1Desc:
      'Des centrales photovoltaïques haute performance et des toitures solaires intelligentes captent le rayonnement maximal de midi. L’énergie propre alimente le hub de batteries central, les tours modernes, les parcs et l’éclairage LED adaptatif.',
    stage1Stat1Label: 'Autonomie Réseau',
    stage1Stat1Val: '96,4 %',
    stage1Stat2Label: 'Efficacité LED',
    stage1Stat2Val: '+68 %',
    stage1Stat3Label: 'CO₂ Évité',
    stage1Stat3Val: '42,8 t/j',

    stage2Badge: 'ÉTAPE 02 · SUPERCHARGE SOLAIRE VE',
    stage2Title: 'La Voiture Électrique Arrive à la Station Solaire',
    stage2Desc:
      'Suivez le boulevard intelligent tandis que le véhicule électrique entre sous l’ombrière photovoltaïque. L’énergie solaire concentrée circule directement du toit vers la borne rapide et recharge la batterie sans prélèvement fossile.',
    stage2Stat1Label: 'Puissance Ombrière',
    stage2Stat1Val: '180 kW',
    stage2Stat2Label: 'Recharge',
    stage2Stat2Val: '22 % → 100 %',
    stage2Stat3Label: 'Source Propre',
    stage2Stat3Val: '100 % Solaire',

    stage3Badge: 'ÉTAPE 03 · RETOUR EN SOIRÉE & STOCKAGE MAISON',
    stage3Title: 'Le Soir Tombe : La Maison Vit sur l’Énergie Solaire Stockée',
    stage3Desc:
      'À la tombée du jour, les lampadaires Smart-City-Led et les phares du véhicule s’allument automatiquement. La voiture rentre dans l’allée résidentielle pendant que la batterie murale solaire et le système V2H éclairent et chauffent la maison.',
    stage3Stat1Label: 'Batterie Murale',
    stage3Stat1Val: '28,5 kWh',
    stage3Stat2Label: 'Secours V2H',
    stage3Stat2Val: 'Actif',
    stage3Stat3Label: 'LED Intelligentes',
    stage3Stat3Val: 'Auto-Régulées',

    stage4Badge: 'ÉTAPE 04 · BOUTIQUE SMART-CITY-LED.COM · NEO CLIM®',
    stage4Title: 'Départ vers la Boutique Smart-City-Led.com pour votre NEO Clim®',
    stage4Desc:
      'Depuis la maison alimentée au solaire, la voiture traverse le boulevard illuminé jusqu’à la boutique officielle Smart-City-Led.com · NEO CLIM® pour récupérer une climatisation solaire réversible A+++ ou un store thermique ZEPHYR.',
    stage4Stat1Label: 'Clim Solaire',
    stage4Stat1Val: 'Inverter A+++',
    stage4Stat2Label: 'Économies',
    stage4Stat2Val: '-80 % à -90 %',
    stage4Stat3Label: 'ZEPHYR Cooler',
    stage4Stat3Val: '-5° à -15°C',
    btnOpenNeoClim: 'Découvrir NEO Clim®',
    btnOpenZephyr: 'ZEPHYR Sun Cooler®',
    btnExplore3d: 'Activer l’Orbite 3D Libre',
    btnBackTop: 'Rejouer le Parcours',

    calcSectionBadge: 'ESTIMATEUR DE RENDEMENT INTERACTIF',
    calcSectionTitle: 'Calculateur d’Économies Solaire & LED Intelligentes',
    calcSectionSubtitle:
      'Estimez la production annuelle d’énergie propre, les économies d’éclairage public LED et l’autonomie de recharge VE.',
    calcRoofLabel: 'Surface Solaire en Toiture (m²)',
    calcPolesLabel: 'Lampadaires LED Intelligents',
    calcEvLabel: 'Trajet VE Quotidien (km)',
    calcSunLabel: 'Ensoleillement Régional',
    calcSunSouth: 'Europe du Sud / Fort Ensoleillement (1 650 kWh/kWc)',
    calcSunCentral: 'Europe Centrale / de l’Est (1 320 kWh/kWc)',
    calcSunNorth: 'Europe du Nord (1 050 kWh/kWc)',
    calcOutSolar: 'Production Solaire Annuelle',
    calcOutSavings: 'Économies Annuelles Estimées',
    calcOutCo2: 'Émissions de CO₂ Évitées',
    calcOutEvKm: 'Autonomie VE Solaire / An',

    solSectionBadge: 'ARCHITECTURE SMART-CITY-LED.COM',
    solSectionTitle: 'Matériel Intégré & Intelligence Réseau',
    sol1Title: 'Micro-Réseaux Solaires Bifaciaux',
    sol1Desc:
      'Panneaux photovoltaïques en toiture et au sol couplés à des onduleurs MPPT en temps réel et des hubs de stockage urbains LFP.',
    sol2Title: 'Mâts LED Intelligents Adaptatifs',
    sol2Desc:
      'Luminaires LED calibrés au crépuscule avec détection de présence et télémétrie IoT réduisant la facture d’éclairage public jusqu’à 72 %.',
    sol3Title: 'Ombrières VE Solaires & V2H',
    sol3Desc:
      'Carports solaires modulaires offrant une charge rapide en journée et un partage bidirectionnel Véhicule-vers-Maison (V2H) le soir.',

    footerTagline: 'Conception de micro-réseaux solaires, d’éclairages LED intelligents et de solutions de mobilité électrique en Europe.',
    footerDomain: 'Smart-City-Led.com · Expérience 3D Statique Prête pour GitHub Pages',
    footerBackTop: 'Haut de Page ↑',

    gridDayCity: 'Pic Solaire → Ville',
    gridCharging: 'Ombrière → Charge Rapide VE',
    gridEveningDrive: 'Crépuscule · LED Activées',
    gridEveningHome: 'Batterie + V2H → Maison',
    gridDriveToStore: 'Maison → Boutique NEO Clim®',
    gridNeoClimStore: 'Smart-City-Led.com · Retrait NEO Clim®',
    gridNightEco: 'Stockage Nocturne Autonome'
  },

  bg: {
    metaTitle: 'Smart-City-Led.com — 3D Соларен Смарт Град и Електромобили',
    brandTag: 'СОЛАР · LED · ЕМ',
    navCity: 'Мини Град',
    navCharging: 'Зарядна Станция',
    navHome: 'Вечерен Дом',
    navCalc: 'Калкулатор',
    navSolutions: 'Решения',

    hudTimeLabel: 'Симулиран Час',
    hudSolarLabel: 'Соларна Мощност',
    hudEvLabel: 'Батерия ЕМ',
    hudGridLabel: 'Режим Мрежа',

    modeStory: 'Водено Превъртане',
    modeOrbit: 'Свободна 3D Орбита',
    btnFlowBoost: 'Енергиен Поток: Нормален',
    btnFlowBoostActive: 'Енергиен Поток: Усилен',
    btnDayNight: 'Преглед Ден / Нощ',
    orbitHint: 'Плъзнете за завъртане · Скрол за мащаб · Десен бутон за преместване',

    scrollPrompt: 'Превъртете надолу, за да проследите соларния енергиен път',

    stage1Badge: 'ЕТАП 01 · ДНЕВНА СОЛАРНА МИКРОМРЕЖА',
    stage1Title: 'Соларните Панели Захранват Целия Мини Град',
    stage1Desc:
      'Високоефективни фотоволтаични паркове и интелигентни покривни панели улавят пиковата обедна слънчева енергия. Чистият ток захранва централния батериен хъб, модерните сгради, парковете и адаптивната LED инфраструктура.',
    stage1Stat1Label: 'Автономност',
    stage1Stat1Val: '96,4%',
    stage1Stat2Label: 'LED Ефективност',
    stage1Stat2Val: '+68%',
    stage1Stat3Label: 'Спестен CO₂',
    stage1Stat3Val: '42,8 т/ден',

    stage2Badge: 'ЕТАП 02 · СОЛАРНО БЪРЗО ЗАРЕЖДАНЕ НА ЕМ',
    stage2Title: 'Електромобилът Пристига на Соларната Зарядна Станция',
    stage2Desc:
      'Проследете булеварда, докато електрическият автомобил спира под соларния навес на зарядната станция. Концентрирана фотоволтаична енергия преминава директно от панелите през колонката и зарежда батерията без въглероден отпечатък.',
    stage2Stat1Label: 'Пик на Навеса',
    stage2Stat1Val: '180 kW',
    stage2Stat2Label: 'Зареждане',
    stage2Stat2Val: '22% → 100%',
    stage2Stat3Label: 'Чист Произход',
    stage2Stat3Val: '100% Солар',

    stage3Badge: 'ЕТАП 03 · ВЕЧЕРНО ПРИБИРАНЕ И ДОМАШНА БАТЕРИЯ',
    stage3Title: 'Пада Мрак: Домът се Захранва от Съхранена Соларна Енергия',
    stage3Desc:
      'С настъпването на вечерта уличните лампи Smart-City-Led и фаровете на колата се включват автоматично. Автомобилът паркира пред дома, докато домашната батерия и V2H системата поддържат уюта и осветлението през нощта.',
    stage3Stat1Label: 'Домашна Батерия',
    stage3Stat1Val: '28,5 kWh',
    stage3Stat2Label: 'V2H Резерв',
    stage3Stat2Val: 'Активен',
    stage3Stat3Label: 'Смарт LED',
    stage3Stat3Val: 'Авто-Режим',

    stage4Badge: 'ЕТАП 04 · ФИРМЕН МАГАЗИН SMART-CITY-LED.COM · NEO CLIM®',
    stage4Title: 'Път от Дома към Магазин Smart-City-Led.com за NEO Clim®',
    stage4Desc:
      'От захранения със соларна енергия дом автомобилът тръгва по осветения булевард към официалния шоурум Smart-City-Led.com · NEO CLIM®, за да вземе соларен климатик A+++ или термо-щора ZEPHYR.',
    stage4Stat1Label: 'Соларна Клима',
    stage4Stat1Val: 'Inverter A+++',
    stage4Stat2Label: 'Спестяване',
    stage4Stat2Val: '-80% до -90%',
    stage4Stat3Label: 'ZEPHYR Cooler',
    stage4Stat3Val: '-5° до -15°C',
    btnOpenNeoClim: 'Отвори NEO Clim®',
    btnOpenZephyr: 'ZEPHYR Sun Cooler®',
    btnExplore3d: 'Влез в Свободна 3D Орбита',
    btnBackTop: 'Повтори Пътуването',

    calcSectionBadge: 'ИНТЕРАКТИВЕН КАЛКУЛАТОР ЗА ВЪЗВРЪЩАЕМОСТ',
    calcSectionTitle: 'Калкулатор за Соларни и Смарт LED Спестявания',
    calcSectionSubtitle:
      'Оценете годишното производство на чиста енергия, спестяванията от LED осветление и пробега на електромобила.',
    calcRoofLabel: 'Площ на Соларния Покрив (м²)',
    calcPolesLabel: 'Смарт LED Улични Стълбове',
    calcEvLabel: 'Дневен Пробег с ЕМ (км)',
    calcSunLabel: 'Регионален Соларен Профил',
    calcSunSouth: 'Южна Европа / Силно Слънце (1 650 kWh/kWp)',
    calcSunCentral: 'Централна и Източна Европа (1 320 kWh/kWp)',
    calcSunNorth: 'Северна Европа (1 050 kWh/kWp)',
    calcOutSolar: 'Годишно Соларно Производство',
    calcOutSavings: 'Очаквани Годишни Спестявания',
    calcOutCo2: 'Спестени Емисии CO₂',
    calcOutEvKm: 'Безплатен Соларен Пробег / Год.',

    solSectionBadge: 'АРХИТЕКТУРА SMART-CITY-LED.COM',
    solSectionTitle: 'Интегриран Хардуер и Умна Мрежа',
    sol1Title: 'Двулицеви Соларни Микромрежи',
    sol1Desc:
      'Високоефективни покривни и наземни фотоволтаични масиви с MPPT инвертори в реално време и квартални LFP батерии.',
    sol2Title: 'Адаптивни Смарт LED Стълбове',
    sol2Desc:
      'LED осветители с датчици за движение, сумрачно калибриране и IoT телеметрия, намаляващи разходите за улично осветление до 72%.',
    sol3Title: 'Соларни Зарядни Навеси и V2H',
    sol3Desc:
      'Модулни соларни навеси за бързо DC зареждане през деня и двупосочно захранване Автомобил-към-Дом (V2H) вечерта.',

    footerTagline: 'Проектиране на чисти соларни микромрежи, адаптивно Смарт LED осветление и автономни ЕМ екосистеми в Европа.',
    footerDomain: 'Smart-City-Led.com · Статичен 3D Проект за GitHub Pages',
    footerBackTop: 'Нагоре ↑',

    gridDayCity: 'Соларен Пик → Град',
    gridCharging: 'Навес → Бързо Зареждане ЕМ',
    gridEveningDrive: 'Здрач · LED Включени',
    gridEveningHome: 'Батерия + V2H → Дом',
    gridDriveToStore: 'Дом → Магазин NEO Clim®',
    gridNeoClimStore: 'Smart-City-Led.com · Получаване NEO Clim®',
    gridNightEco: 'Нощно Автономно Съхранение'
  },

  ro: {
    metaTitle: 'Smart-City-Led.com — Oraș Inteligent Solar 3D & Ecosistem EV',
    brandTag: 'SOLAR · LED · EV',
    navCity: 'Mini-Oraș',
    navCharging: 'Stație EV',
    navHome: 'Casă Seara',
    navCalc: 'Calculator',
    navSolutions: 'Soluții',

    hudTimeLabel: 'Oră Simulată',
    hudSolarLabel: 'Producție Solară',
    hudEvLabel: 'Baterie EV',
    hudGridLabel: 'Mod Rețea',

    modeStory: 'Derulare Ghidată',
    modeOrbit: 'Orbită 3D Liberă',
    btnFlowBoost: 'Flux Energie: Normal',
    btnFlowBoostActive: 'Flux Energie: Intens',
    btnDayNight: 'Previzualizare Zi / Noapte',
    orbitHint: 'Trageți pentru rotire · Rotița pentru zoom · Click dreapta pentru deplasare',

    scrollPrompt: 'Derulați în jos pentru a urmări călătoria energiei solare',

    stage1Badge: 'ETAPA 01 · MICRO-REȚEA SOLARĂ DE ZI',
    stage1Title: 'Panourile Solare Alimentează Întregul Mini-Oraș',
    stage1Desc:
      'Parcurile fotovoltaice de înaltă eficiență și panourile inteligente de pe acoperișuri captează radiația maximă a prânzului. Energia curată ajunge în hub-ul central de baterii și alimentează clădirile, parcurile și rețeaua LED adaptivă.',
    stage1Stat1Label: 'Autonomie Rețea',
    stage1Stat1Val: '96,4%',
    stage1Stat2Label: 'Eficiență LED',
    stage1Stat2Val: '+68%',
    stage1Stat3Label: 'CO₂ Evitat',
    stage1Stat3Val: '42,8 t/zi',

    stage2Badge: 'ETAPA 02 · STAȚIE SOLARĂ DE ÎNCĂRCARE EV',
    stage2Title: 'Mașina Electrică Sosește la Stația de Încărcare Solară',
    stage2Desc:
      'Urmăriți bulevardul inteligent în timp ce automobilul electric intră sub copertina fotovoltaică. Energia solară concentrată circulă direct din acoperiș prin stația rapidă și încarcă bateria fără consum din rețeaua fosilă.',
    stage2Stat1Label: 'Vârf Copertină',
    stage2Stat1Val: '180 kW',
    stage2Stat2Label: 'Încărcare',
    stage2Stat2Val: '22% → 100%',
    stage2Stat3Label: 'Sursă Curată',
    stage2Stat3Val: '100% Solar',

    stage3Badge: 'ETAPA 03 · DRUMUL SPRE CASĂ & STOCARE DE SEARĂ',
    stage3Title: 'Se Lasă Seara: Casa Este Alimentată din Stocarea Solară',
    stage3Desc:
      'Pe măsură ce amurgul trece în noapte, stâlpii LED Smart-City-Led și farurile mașinii se aprind automat. Vehiculul intră pe aleea casei inteligente, iar bateria solară de perete împreună cu sistemul V2H alimentează locuința.',
    stage3Stat1Label: 'Baterie Perete',
    stage3Stat1Val: '28,5 kWh',
    stage3Stat2Label: 'Rezervă V2H',
    stage3Stat2Val: 'Activă',
    stage3Stat3Label: 'LED-uri Smart',
    stage3Stat3Val: 'Auto-Reglate',

    stage4Badge: 'ETAPA 04 · MAGAZIN SMART-CITY-LED.COM · NEO CLIM®',
    stage4Title: 'Drum spre Magazinul Smart-City-Led.com pentru NEO Clim® Solar',
    stage4Desc:
      'De la casa alimentată solar, mașina traversează bulevardul iluminat până la showroom-ul oficial Smart-City-Led.com · NEO CLIM® pentru a ridica sistemul de climatizare solară A+++ sau jaluzeaua ZEPHYR.',
    stage4Stat1Label: 'Climă Solară',
    stage4Stat1Val: 'Inverter A+++',
    stage4Stat2Label: 'Economii',
    stage4Stat2Val: '-80% la -90%',
    stage4Stat3Label: 'ZEPHYR Cooler',
    stage4Stat3Val: '-5° la -15°C',
    btnOpenNeoClim: 'Explorează NEO Clim®',
    btnOpenZephyr: 'ZEPHYR Sun Cooler®',
    btnExplore3d: 'Intră în Orbită 3D Liberă',
    btnBackTop: 'Reia Călătoria',

    calcSectionBadge: 'ESTIMATOR INTERACTIV DE ECONOMII',
    calcSectionTitle: 'Calculator de Economii Solar & LED Inteligent',
    calcSectionSubtitle:
      'Estimați producția anuală de energie curată, economiile de iluminat stradal LED și autonomia EV.',
    calcRoofLabel: 'Suprafață Solară Acoperiș (m²)',
    calcPolesLabel: 'Stâlpi Stradali Smart LED',
    calcEvLabel: 'Navetă Zilnică EV (km)',
    calcSunLabel: 'Profil Solar Regional',
    calcSunSouth: 'Europa de Sud / Soare Puternic (1.650 kWh/kWp)',
    calcSunCentral: 'Europa Centrală și de Est (1.320 kWh/kWp)',
    calcSunNorth: 'Europa de Nord (1.050 kWh/kWp)',
    calcOutSolar: 'Producție Solară Anuală',
    calcOutSavings: 'Economii Anuale Estimate',
    calcOutCo2: 'Emisii CO₂ Prevenite',
    calcOutEvKm: 'Autonomie EV Solară / An',

    solSectionBadge: 'ARHITECTURĂ SMART-CITY-LED.COM',
    solSectionTitle: 'Hardware Integrat & Inteligență de Rețea',
    sol1Title: 'Micro-Rețele Solare Bifaciale',
    sol1Desc:
      'Matrici fotovoltaice pe acoperiș și la sol cu invertoare MPPT în timp real și hub-uri urbane de stocare LFP.',
    sol2Title: 'Stâlpi Smart LED Adaptivi',
    sol2Desc:
      'Corpuri de iluminat LED calibrate la amurg cu senzori de mișcare și telemetrie IoT care reduc consumul municipal cu până la 72%.',
    sol3Title: 'Copertine EV Solare & V2H',
    sol3Desc:
      'Copertine solare modulare pentru încărcare rapidă DC ziua și transfer bidirecțional Vehicul-către-Casă (V2H) seara.',

    footerTagline: 'Proiectăm micro-rețele solare curate, iluminat stradal Smart LED și ecosisteme autonome EV în Europa.',
    footerDomain: 'Smart-City-Led.com · Experiență 3D Statică Pregătită pentru GitHub Pages',
    footerBackTop: 'Înapoi Sus ↑',

    gridDayCity: 'Vârf Solar → Oraș',
    gridCharging: 'Copertină → Încărcare Rapidă EV',
    gridEveningDrive: 'Amurg · LED-uri Aprinse',
    gridEveningHome: 'Baterie + V2H → Casă',
    gridDriveToStore: 'Casă → Magazin NEO Clim®',
    gridNeoClimStore: 'Smart-City-Led.com · Ridicare NEO Clim®',
    gridNightEco: 'Stocare Nocturnă Autonomă'
  }
};

export class I18nManager {
  constructor(defaultLang = 'en') {
    const saved = this.getStoredLang();
    const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
    this.lang = SUPPORTED_LANGS.includes(saved)
      ? saved
      : SUPPORTED_LANGS.includes(browserLang)
        ? browserLang
        : defaultLang;
    this.listeners = new Set();
  }

  getStoredLang() {
    try {
      return localStorage.getItem('smartcity_lang');
    } catch {
      return null;
    }
  }

  setStoredLang(lang) {
    try {
      localStorage.setItem('smartcity_lang', lang);
    } catch {
      // Ignore storage errors in sandboxed iframes
    }
  }

  get(key) {
    const dict = TRANSLATIONS[this.lang] || TRANSLATIONS.en;
    return dict[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    this.lang = lang;
    this.setStoredLang(lang);
    this.applyToDOM();
    this.listeners.forEach((cb) => cb(this.lang));
  }

  onChange(cb) {
    this.listeners.add(cb);
  }

  applyToDOM() {
    document.documentElement.lang = this.lang;
    document.title = this.get('metaTitle');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.get(key);
      }
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const isMatch = btn.getAttribute('data-lang') === this.lang;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', String(isMatch));
    });
  }
}
