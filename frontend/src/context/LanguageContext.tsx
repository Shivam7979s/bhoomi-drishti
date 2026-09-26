import React, { createContext, useContext, useState, useMemo } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'te';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
];

export interface Translations {
  header: {
    sovereignTagline: string;
    govBadge: string;
    fontSmall: string;
    fontNormal: string;
    fontLarge: string;
    selectLanguage: string;
    profile: string;
    myLandRecords: string;
    workspaces: string;
    logout: string;
    explorePlatform: string;
    loginRegister: string;
    dashboard: string;
    savedResearch: string;
  };
  sidebar: {
    home: string;
    myLandRecords: string;
    registrySearch: string;
    workspacesVault: string;
    landGovServices: string;
    gisCadastreMap: string;
    revenueGovernance: string;
    statutoryAi: string;
    aboutBhoomi: string;
    bhuvanPortal: string;
    portalBadge: string;
  };
  welcome: {
    greeting: string;
    subtitle: string;
    verifiedCitizen: string;
  };
  slider: {
    heading: string;
    subheading: string;
    pullDocument: string;
    rorTag: string;
    rorTitle: string;
    rorSub: string;
    rorDept: string;
    mutationTag: string;
    mutationTitle: string;
    mutationSub: string;
    mutationDept: string;
    saleDeedTag: string;
    saleDeedTitle: string;
    saleDeedSub: string;
    saleDeedDept: string;
    mapTag: string;
    mapTitle: string;
    mapSub: string;
    mapDept: string;
  };
  stateServices: {
    heading: string;
    subheading: string;
    viewAll: string;
    availableNow: string;
    mpTitle: string;
    mpSub: string;
    mpDept: string;
    upTitle: string;
    upSub: string;
    upDept: string;
    mhTitle: string;
    mhSub: string;
    mhDept: string;
    gjTitle: string;
    gjSub: string;
    gjDept: string;
  };
  issuedRecords: {
    heading: string;
    subheading: string;
    viewAll: string;
    activeStatus: string;
    gisMap: string;
    askAi: string;
    areaHectares: string;
    noRecordsTitle: string;
    noRecordsDesc: string;
    exploreRegistry: string;
  };
  quickTools: {
    heading: string;
    subheading: string;
    launchEngine: string;
    gisTitle: string;
    gisTag: string;
    gisDesc: string;
    govTitle: string;
    govTag: string;
    govDesc: string;
    aiTitle: string;
    aiTag: string;
    aiDesc: string;
    vaultTitle: string;
    vaultTag: string;
    vaultDesc: string;
  };
  landRecordsPage: {
    pageTitle: string;
    pageSubtitle: string;
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    addRecordBtn: string;
    spatialSearchBtn: string;
    resetFiltersBtn: string;
    searchPlaceholder: string;
    allStates: string;
    filterDistrict: string;
    allLandUse: string;
    allStatuses: string;
    cardView: string;
    tableView: string;
    metricTotalParcels: string;
    metricTotalArea: string;
    metricActiveTitles: string;
    metricStatesCovered: string;
    colParcel: string;
    colLocation: string;
    colArea: string;
    colLandUse: string;
    colStatus: string;
    colActions: string;
    actionViewDetails: string;
    actionGisMap: string;
    actionAskAi: string;
    actionEdit: string;
    actionDelete: string;
    emptyTitle: string;
    emptyDesc: string;
  };
  explorePage: {
    pageTitle: string;
    pageSubtitle: string;
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    searchPlaceholder: string;
    allTypes: string;
    typeStatute: string;
    typeOrder: string;
    typePolicy: string;
    typeCircular: string;
    allStates: string;
    resetFiltersBtn: string;
    metricStatutes: string;
    metricStates: string;
    metricPrecedents: string;
    metricAiIndex: string;
    statePortalsHeading: string;
    statePortalsSub: string;
    resultsHeading: string;
    thematicHeading: string;
    thematicSub: string;
    actionViewDoc: string;
    actionAskAi: string;
    askAiPrompt: string;
  };
  gisPage: {
    pageTitle: string;
    pageSubtitle: string;
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    filterBtn: string;
    resetViewBtn: string;
    legendTitle: string;
    metricLoadedParcels: string;
    metricSpatialEngine: string;
    metricZoomStatus: string;
    metricSurveyStandard: string;
    zoomWarning: string;
    truncatedWarning: string;
    fetchingLayer: string;
    quickLocations: string;
    locBhopal: string;
    locIndore: string;
    locSehore: string;
    layerAgricultural: string;
    layerResidential: string;
    layerCommercial: string;
    layerIndustrial: string;
    layerForest: string;
    layerWaterBody: string;
    layerDisputed: string;
    drawerTitle: string;
    tabSpatialDetails: string;
    tabLinkedResearch: string;
    tabAiEvidence: string;
    btnLinkProject: string;
    btnCopyGeoJson: string;
    btnZoomParcel: string;
    lblParcelId: string;
    lblOwner: string;
    lblArea: string;
    lblLandUse: string;
    lblStatus: string;
    lblCoordinates: string;
  };
  governancePage: {
    pageTitle: string;
    pageSubtitle: string;
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    temporalCompareBtn: string;
    refreshBtn: string;
    badgeLive: string;
    badgeFramework: string;
    metricDigitizationTitle: string;
    metricDigitizationSub: string;
    metricMutationTitle: string;
    metricMutationSub: string;
    metricPostGisSyncTitle: string;
    metricPostGisSyncSub: string;
    metricAuditTrailTitle: string;
    metricAuditTrailSub: string;
    scopeNational: string;
    scopeState: string;
    scopeDistrict: string;
    scopeTehsil: string;
    scopeVillage: string;
    tabExecutiveSummary: string;
    tabDetailedMetrics: string;
    tabAuditSnapshots: string;
    btnCaptureSnapshot: string;
    lblActiveBaseline: string;
  };
  assistantPage: {
    pageTitle: string;
    pageSubtitle: string;
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    badgeAiSynthesis: string;
    advisoryNotice: string;
    advisoryDisclaimer: string;
    activeContextLabel: string;
    activeContextDesc: string;
    btnClearContext: string;
    queryInputPlaceholder: string;
    btnAskAssistant: string;
    btnSynthesizing: string;
    btnScopeFilter: string;
    filterTargetDocType: string;
    optAllDocTypes: string;
    optResearchPaper: string;
    optPolicyDocument: string;
    optGovReport: string;
    optAcademicPub: string;
    optLegalDoc: string;
    metricStatutesIndexedTitle: string;
    metricStatutesIndexedSub: string;
    metricGroundingThresholdTitle: string;
    metricGroundingThresholdSub: string;
    metricAvgLatencyTitle: string;
    metricAvgLatencySub: string;
    metricZeroHallucinationTitle: string;
    metricZeroHallucinationSub: string;
    emptyTitle: string;
    emptySubtitle: string;
    featureStrictGroundingTitle: string;
    featureStrictGroundingSub: string;
    featureInteractiveProvenanceTitle: string;
    featureInteractiveProvenanceSub: string;
    featureZeroHallucinationTitle: string;
    featureZeroHallucinationSub: string;
    suggestedQueriesTitle: string;
    catLandTransfer: string;
    queryLandTransfer: string;
    catCadastralStandards: string;
    queryCadastralStandards: string;
    catRecordOfRights: string;
    queryRecordOfRights: string;
    catForestTribalRights: string;
    queryForestTribalRights: string;
    assistantResponseHeading: string;
    auditDiagnostics: string;
    verifiedCitationsCount: string;
    queryEchoPrefix: string;
  };
  workspacesPage: {
    pageTitle: string;
    pageSubtitle: string;
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    badgeCollaborative: string;
    badgeVault: string;
    btnNewWorkspace: string;
    tabAll: string;
    tabMy: string;
    metricTotalWorkspacesTitle: string;
    metricTotalWorkspacesSub: string;
    metricActiveProjectsTitle: string;
    metricActiveProjectsSub: string;
    metricLinkedParcelsTitle: string;
    metricLinkedParcelsSub: string;
    metricAuditReadyTitle: string;
    metricAuditReadySub: string;
    emptyTitle: string;
    emptySubAll: string;
    emptySubMy: string;
    btnCreateFirst: string;
    cardPublic: string;
    cardPrivate: string;
    cardMember: string;
    cardMembers: string;
    cardProject: string;
    cardProjects: string;
    cardOpen: string;
    cardNoDesc: string;
    modalTitle: string;
    modalSub: string;
    lblWorkspaceName: string;
    phWorkspaceName: string;
    lblInstitution: string;
    phInstitution: string;
    lblVisibility: string;
    optPrivate: string;
    optPublic: string;
    lblDescription: string;
    phDescription: string;
    btnCancel: string;
    btnCreate: string;
    btnCreating: string;
  };
  profilePage: {
    pageTitle: string;
    pageSubtitle: string;
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    badgeVerifiedSession: string;
    badgeInstitutional: string;
    btnSignOut: string;
    btnSigningOut: string;
    metricAccountStatusTitle: string;
    metricAccountStatusSub: string;
    metricPlatformRoleTitle: string;
    metricPlatformRoleSub: string;
    metricJurisdictionTitle: string;
    metricJurisdictionSub: string;
    metricSecurityTitle: string;
    metricSecuritySub: string;
    secCredentialsTitle: string;
    secCredentialsSub: string;
    lblFullName: string;
    lblEmail: string;
    lblPlatformRole: string;
    lblSignedInVia: string;
    lblAccountId: string;
    valGoogleSso: string;
    valEmailPassword: string;
    noticeSecurity: string;
    secJurisdictionsTitle: string;
    secJurisdictionsSub: string;
    lblStateRevenue: string;
    valStateRevenue: string;
    lblDistricts: string;
    valDistricts: string;
    lblTehsils: string;
    valTehsils: string;
    lblAccessScope: string;
    valAccessScope: string;
    roleAdmin: string;
    roleGovOfficial: string;
    roleResearcher: string;
    roleAcademia: string;
    rolePublic: string;
  };
  homePage: {
    heroBadge1: string;
    heroHeadline1: string;
    heroAccent1: string;
    heroSub1: string;
    heroPill1a: string;
    heroPill1b: string;
    heroPill1c: string;
    heroBadge2: string;
    heroHeadline2: string;
    heroAccent2: string;
    heroSub2: string;
    heroPill2a: string;
    heroPill2b: string;
    heroPill2c: string;
    heroBadge3: string;
    heroHeadline3: string;
    heroAccent3: string;
    heroSub3: string;
    heroPill3a: string;
    heroPill3b: string;
    heroPill3c: string;
    heroBadge4: string;
    heroHeadline4: string;
    heroAccent4: string;
    heroSub4: string;
    heroPill4a: string;
    heroPill4b: string;
    heroPill4c: string;
    heroBtnExplore: string;
    heroBtnLogin: string;
    heroBtnDashboard: string;
    statParcelsVal: string;
    statParcelsLbl: string;
    statParcelsSub: string;
    statDistrictsVal: string;
    statDistrictsLbl: string;
    statDistrictsSub: string;
    statInstrumentsVal: string;
    statInstrumentsLbl: string;
    statInstrumentsSub: string;
    statPrecisionVal: string;
    statPrecisionLbl: string;
    statPrecisionSub: string;
    newBadge: string;
    newTitle: string;
    newSub: string;
    newViewAll: string;
    newDeedTitle: string;
    newDeedDesc: string;
    newActTitle: string;
    newActDesc: string;
    newLeasingTitle: string;
    newLeasingDesc: string;
    newDilrmpTitle: string;
    newDilrmpDesc: string;
    newVelocityTitle: string;
    newVelocityDesc: string;
    newAiTitle: string;
    newAiDesc: string;
    ctaTitle: string;
    ctaSub: string;
    ctaBtnExplore: string;
    ctaBtnLogin: string;
    ctaBtnGovernance: string;
    ctaBtnGis: string;
  };
}

const DICTIONARY: Record<SupportedLanguage, Translations> = {
  en: {
    header: {
      sovereignTagline: 'Sovereign Digital Platform for Land Governance',
      govBadge: 'GOV.IN',
      fontSmall: 'Decrease font size',
      fontNormal: 'Default font size',
      fontLarge: 'Increase font size',
      selectLanguage: 'Language',
      profile: 'Citizen Profile Details',
      myLandRecords: 'My Land Records',
      workspaces: 'Workspaces & Vault',
      logout: 'Sign Out',
      explorePlatform: 'Explore Platform',
      loginRegister: 'Login / Register',
      dashboard: 'Dashboard',
      savedResearch: 'Saved Research',
    },
    sidebar: {
      home: 'Home',
      myLandRecords: 'My Land Records',
      registrySearch: 'Registry & Cadastre Search',
      workspacesVault: 'Workspaces & Vault',
      landGovServices: 'Land Governance Services',
      gisCadastreMap: 'GIS Cadastre Map',
      revenueGovernance: 'Revenue Governance Radar',
      statutoryAi: 'Statutory AI Assistant',
      aboutBhoomi: 'About BHOOMI-DRISHTI',
      bhuvanPortal: 'Bhuvan ISRO Geo-Portal',
      portalBadge: 'ISRO',
    },
    welcome: {
      greeting: 'Welcome',
      subtitle: 'Access your verified land records, statutory instruments, and sovereign spatial registry.',
      verifiedCitizen: 'Verified Citizen Account',
    },
    slider: {
      heading: 'Key Land Records & Title Instruments',
      subheading: 'Search, pull, and verify certified revenue documents across Indian states',
      pullDocument: 'Pull Document Now',
      rorTag: 'OFFICIAL RECORD OF RIGHTS',
      rorTitle: 'Khasra - Khatauni (RoR)',
      rorSub: 'खसरा - खतौनी (अभिलेख)',
      rorDept: 'Department of Revenue & Land Records',
      mutationTag: 'NAMANTARAN AADESH',
      mutationTitle: 'Mutation Decree & Order',
      mutationSub: 'नामांतरण आदेश एवं प्रमाण पत्र',
      mutationDept: 'Tehsildar Revenue Court',
      saleDeedTag: 'CERTIFIED CONVEYANCE',
      saleDeedTitle: 'Registered Sale & Title Deed',
      saleDeedSub: 'पंजीकृत बैनामा / विक्रय पत्र',
      saleDeedDept: 'Inspector General of Registration',
      mapTag: 'GIS PARCEL SURVEY',
      mapTitle: 'Spatial Cadastral Map',
      mapSub: 'भू-नक्शा (डिजिटल भूखंड सीमा)',
      mapDept: 'Survey of India / DILRMP Cadastre',
    },
    stateServices: {
      heading: 'Newly Integrated State Services',
      subheading: 'Live automated sync with state digital land record authorities',
      viewAll: 'View All Services',
      availableNow: 'Available Now',
      mpTitle: 'Registered Conveyance Deed',
      mpSub: 'पंजीकृत विक्रय विलेख',
      mpDept: 'Registration & Stamp Department, MP',
      upTitle: 'Khasra - Khatauni (B-1)',
      upSub: 'खसरा - खतौनी भू-अभिलेख',
      upDept: 'Board of Revenue, UP (Bhulekh)',
      mhTitle: 'Mutation Clearance Order',
      mhSub: 'फेरफार / ७/१२ उतारा',
      mhDept: 'Directorate of Land Records, Maharashtra',
      gjTitle: 'Geo-Referenced Bhu-Naksha',
      gjSub: 'डिजिटल गांव नक्शा एवं सीमा',
      gjDept: 'Superintendent of Land Records, Gujarat',
    },
    issuedRecords: {
      heading: 'My Issued Land Documents & Verified Parcels',
      subheading: 'Active title deeds and cadastral parcels linked to your revenue account',
      viewAll: 'View All',
      activeStatus: 'ACTIVE',
      gisMap: 'GIS Map',
      askAi: 'Ask AI',
      areaHectares: 'Ha',
      noRecordsTitle: 'No Issued Land Documents Found',
      noRecordsDesc: "You haven't pulled or linked any land parcels to your citizen account yet.",
      exploreRegistry: 'Explore Registry Now',
    },
    quickTools: {
      heading: 'Platform Capabilities & Quick Tools',
      subheading: 'Direct access to core spatial, administrative, and AI intelligence engines',
      launchEngine: 'Launch Engine',
      gisTitle: 'GIS Cadastral Explorer',
      gisTag: 'Spatial Registry',
      gisDesc: 'Explore geo-referenced boundaries, satellite base layers, and real-time land parcel overlays.',
      govTitle: 'Revenue Governance Radar',
      govTag: 'Live KPI Radar',
      govDesc: 'Track district-level mutation velocity, revenue dispute backlog, and transparency indices.',
      aiTitle: 'Statutory AI Assistant',
      aiTag: 'Legal Intelligence',
      aiDesc: 'Query land reform statutes, cite RFCTLARR 2013, RERA, and Model Tenancy Act provisions.',
      vaultTitle: 'Workspaces & Policy Vault',
      vaultTag: 'Team Workspaces',
      vaultDesc: 'Collaborate on policy simulations, land acquisition cases, and institutional research projects.',
    },
    landRecordsPage: {
      pageTitle: 'My Land Records & Title Instruments',
      pageSubtitle: 'Certified Record of Rights (RoR), Cadastral Parcels, and Statutory Title Instruments',
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'My Land Records',
      addRecordBtn: 'Add Parcel Record',
      spatialSearchBtn: 'Spatial Bounding Filter',
      resetFiltersBtn: 'Reset Filters',
      searchPlaceholder: 'Search by Parcel Number, ULPIN, Village...',
      allStates: 'All Indian States',
      filterDistrict: 'Filter by District...',
      allLandUse: 'All Land Uses',
      allStatuses: 'All Statuses',
      cardView: 'Cards',
      tableView: 'Registry Table',
      metricTotalParcels: 'Total Verified Parcels',
      metricTotalArea: 'Cumulative Area',
      metricActiveTitles: 'Active Certified Deeds',
      metricStatesCovered: 'Jurisdictions Covered',
      colParcel: 'Parcel Number / ULPIN',
      colLocation: 'Village & District',
      colArea: 'Area (Hectares)',
      colLandUse: 'Land Classification',
      colStatus: 'Statutory Status',
      colActions: 'Actions',
      actionViewDetails: 'View RoR',
      actionGisMap: 'GIS Map',
      actionAskAi: 'Ask AI',
      actionEdit: 'Edit',
      actionDelete: 'Delete',
      emptyTitle: 'No Land Records Found',
      emptyDesc: 'No revenue parcels match your filter criteria. Try adjusting your search query.',
    },
    explorePage: {
      pageTitle: 'Registry & Cadastre Search',
      pageSubtitle: 'Universal search engine for land reform statutes, state cadastres, and revenue precedents',
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Registry & Cadastre Search',
      searchPlaceholder: 'Search by statute name, RFCTLARR section, tenancy clause, or keyword...',
      allTypes: 'All Document Types',
      typeStatute: 'Statute / Act',
      typeOrder: 'Judicial Order',
      typePolicy: 'Policy Paper',
      typeCircular: 'Revenue Circular',
      allStates: 'All Jurisdictions',
      resetFiltersBtn: 'Reset Filters',
      metricStatutes: 'Published Statutes',
      metricStates: 'State Cadastres',
      metricPrecedents: 'Legal Precedents',
      metricAiIndex: 'AI Knowledge Index',
      statePortalsHeading: 'State Cadastral Registries & Revenue Portals',
      statePortalsSub: 'Direct access to state digital land record repositories',
      resultsHeading: 'Statutory Search Results & Documents',
      thematicHeading: 'Thematic Land Governance Pillars',
      thematicSub: 'Core policy frameworks and legislative domains',
      actionViewDoc: 'View Document',
      actionAskAi: 'Analyze with AI',
      askAiPrompt: 'Query Statutory AI',
    },
    gisPage: {
      pageTitle: 'Spatial Cadastre & GIS Land Parcel Explorer',
      pageSubtitle: 'High-resolution interactive cadastral map showing PostGIS spatial parcel boundaries, land use zoning, and title linkages.',
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'GIS Cadastre Map',
      filterBtn: 'GIS Spatial Filters',
      resetViewBtn: 'Reset Spatial View',
      legendTitle: 'Cadastral Legend',
      metricLoadedParcels: 'Parcels in Viewport',
      metricSpatialEngine: 'PostGIS Spatial Engine',
      metricZoomStatus: 'Cadastre Resolution',
      metricSurveyStandard: 'Survey of India Standard',
      zoomWarning: 'Zoom in closer (Level 12+) to load cadastral parcel boundaries.',
      truncatedWarning: 'Viewport truncated: Zoom in to inspect local cadastral parcels.',
      fetchingLayer: 'Fetching spatial layer...',
      quickLocations: 'Cadastral Presets:',
      locBhopal: 'Bhopal (Huzur Tehsil)',
      locIndore: 'Indore (Rau Tehsil)',
      locSehore: 'Sehore (Agri Cadastre)',
      layerAgricultural: 'Agricultural Farmland',
      layerResidential: 'Residential Plots',
      layerCommercial: 'Commercial Zone',
      layerIndustrial: 'Industrial Zone',
      layerForest: 'Forest & Eco Reserve',
      layerWaterBody: 'Water Body & Riverine',
      layerDisputed: 'Disputed / Encumbered',
      drawerTitle: 'Cadastral Parcel Dossier',
      tabSpatialDetails: 'Spatial Attributes',
      tabLinkedResearch: 'Linked Research & Deeds',
      tabAiEvidence: 'AI Precedents & Evidence',
      btnLinkProject: 'Link to Project',
      btnCopyGeoJson: 'Copy PostGIS GeoJSON',
      btnZoomParcel: 'Focus Parcel on Map',
      lblParcelId: 'Parcel / Khasra No.',
      lblOwner: 'Recorded Title Holder',
      lblArea: 'Cadastral Area',
      lblLandUse: 'Land Use Classification',
      lblStatus: 'Title & Mutation Status',
      lblCoordinates: 'Centroid Coordinates',
    },
    governancePage: {
      pageTitle: 'Revenue Governance Radar & Statutory Benchmarks',
      pageSubtitle: 'Real-time land governance indicators, mutation velocities, dispute pendency distributions, and statutory compliance audit baselines.',
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Revenue Governance Radar',
      temporalCompareBtn: 'Temporal State Comparisons',
      refreshBtn: 'Refresh Metrics',
      badgeLive: 'Live PostGIS Computation',
      badgeFramework: 'NIC Governance Framework',
      metricDigitizationTitle: 'Land Records Digitization',
      metricDigitizationSub: 'Computerized RoRs nationwide',
      metricMutationTitle: 'Mean Mutation Velocity',
      metricMutationSub: 'Statutory disposal avg. time',
      metricPostGisSyncTitle: 'Spatial Cadastre Sync',
      metricPostGisSyncSub: 'States & UTs integrated',
      metricAuditTrailTitle: 'Statutory Audit Trail',
      metricAuditTrailSub: 'Immutable baseline snapshots',
      scopeNational: 'National Overview',
      scopeState: 'State Governance',
      scopeDistrict: 'District Collectorate',
      scopeTehsil: 'Tehsil Revenue Court',
      scopeVillage: 'Gram Cadastre',
      tabExecutiveSummary: 'Executive Governance Radar',
      tabDetailedMetrics: 'Comprehensive Indicator Matrix',
      tabAuditSnapshots: 'Point-in-Time Audit Snapshots',
      btnCaptureSnapshot: 'Capture Audit Snapshot',
      lblActiveBaseline: 'Active Cadastral Aggregation',
    },
    assistantPage: {
      pageTitle: 'Evidence-Grounded Statutory AI Assistant',
      pageSubtitle: 'Interactive legal synthesis grounded strictly in verified statutory circulars, policy manuals, and cadastral research documents with pre-retrieval role checks and evidence sufficiency safeguards.',
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Statutory AI Assistant',
      badgeAiSynthesis: 'Statutory AI Synthesis',
      advisoryNotice: 'Statutory Research Notice',
      advisoryDisclaimer: 'BHOOMI-DRISHTI provides evidence-backed synthesis based exclusively on authorized documents in the knowledge repository. It does not replace certified legal counsel or official revenue authority rulings.',
      activeContextLabel: 'Active Statutory Context:',
      activeContextDesc: 'Retrieval and statutory synthesis will be grounded in and restricted to this platform resource.',
      btnClearContext: 'Clear Context',
      queryInputPlaceholder: 'Ask a question about statutory regulations, cadastral standards, or land governance provisions...',
      btnAskAssistant: 'Ask Assistant',
      btnSynthesizing: 'Synthesizing...',
      btnScopeFilter: 'Scope Filter',
      filterTargetDocType: 'Target Document Type:',
      optAllDocTypes: 'All Document Types',
      optResearchPaper: 'Research Paper',
      optPolicyDocument: 'Policy Document',
      optGovReport: 'Government Report',
      optAcademicPub: 'Academic Publication',
      optLegalDoc: 'Legal Document',
      metricStatutesIndexedTitle: '1,420+ Statutes & Circulars',
      metricStatutesIndexedSub: 'MPLRC, Forest Rights & Rules',
      metricGroundingThresholdTitle: 'Strict Gating Threshold',
      metricGroundingThresholdSub: 'Zero Extractive Hallucination',
      metricAvgLatencyTitle: 'Mean Response Velocity',
      metricAvgLatencySub: '~1.2s Semantic Retrieval',
      metricZeroHallucinationTitle: 'Statutory Provenance',
      metricZeroHallucinationSub: '100% Verifiable Source Chunks',
      emptyTitle: 'Evidence-Grounded Statutory & Policy Intelligence',
      emptySubtitle: 'Ask specific statutory or land governance questions. Every synthesized response is backed by authoritative excerpts retrieved from published research documents, policy circulars, and cadastral survey manuals.',
      featureStrictGroundingTitle: 'Strict Evidence Grounding',
      featureStrictGroundingSub: 'The assistant only generates answers supported by verified chunks. Weak or missing evidence triggers automatic safety gating.',
      featureInteractiveProvenanceTitle: 'Interactive Provenance',
      featureInteractiveProvenanceSub: 'Every bracketed citation references an exact chunk in the database with page numbers, section titles, and publication metadata.',
      featureZeroHallucinationTitle: 'No Phantom Hallucinations',
      featureZeroHallucinationSub: 'Unreferenced or fabricated citations are stripped by server-side verification before the answer is delivered to your screen.',
      suggestedQueriesTitle: 'Suggested Statutory Inquiries',
      catLandTransfer: 'Land Transfer Regulations',
      queryLandTransfer: 'What statutory provisions address agricultural land transfers?',
      catCadastralStandards: 'Cadastral Standards',
      queryCadastralStandards: 'What are the cadastral boundary accuracy standards for drone surveys?',
      catRecordOfRights: 'Record of Rights',
      queryRecordOfRights: 'What documents outline the digitization requirements for Record of Rights?',
      catForestTribalRights: 'Forest & Tribal Rights',
      queryForestTribalRights: 'What legal frameworks address tribal land tenure and forest rights?',
      assistantResponseHeading: 'Statutory Assistant Response',
      auditDiagnostics: 'Audit & Retrieval Diagnostics',
      verifiedCitationsCount: 'verified citations',
      queryEchoPrefix: 'Question:',
    },
    workspacesPage: {
      pageTitle: 'Research Workspaces & Sovereign Vault',
      pageSubtitle: 'Institutional collaboration hubs for land governance research, GIS cadastral parcel intelligence, policy scenario modeling, and shared verified datasets.',
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Workspaces & Vault',
      badgeCollaborative: 'Collaborative Environment',
      badgeVault: 'Sovereign Research Vault',
      btnNewWorkspace: 'New Workspace',
      tabAll: 'All Institutional Workspaces',
      tabMy: 'My Active Workspaces',
      metricTotalWorkspacesTitle: 'Institutional Workspaces',
      metricTotalWorkspacesSub: 'Revenue, Survey & Academia',
      metricActiveProjectsTitle: 'Collaborative Projects',
      metricActiveProjectsSub: 'Cadastral & Land Records',
      metricLinkedParcelsTitle: 'Linked Cadastral Parcels',
      metricLinkedParcelsSub: 'PostGIS Spatial Bindings',
      metricAuditReadyTitle: 'Role-Based RBAC Vault',
      metricAuditReadySub: 'Statutory Immutable Audit',
      emptyTitle: 'No workspaces found',
      emptySubAll: 'There are no public workspaces available right now.',
      emptySubMy: "You haven't joined or created any workspaces yet.",
      btnCreateFirst: 'Create your first workspace',
      cardPublic: 'Public',
      cardPrivate: 'Private',
      cardMember: 'member',
      cardMembers: 'members',
      cardProject: 'project',
      cardProjects: 'projects',
      cardOpen: 'Open Workspace',
      cardNoDesc: 'No description provided.',
      modalTitle: 'Create Research Workspace',
      modalSub: 'Establish an institutional hub for research projects, datasets, and GIS parcel analysis.',
      lblWorkspaceName: 'Workspace Name *',
      phWorkspaceName: 'e.g., Madhya Pradesh Land Governance Lab',
      lblInstitution: 'Institution / Organization',
      phInstitution: 'e.g., Department of Land Resources / IIT Indore',
      lblVisibility: 'Access Visibility',
      optPrivate: 'Private (Members & Officials Only)',
      optPublic: 'Public (Discoverable by All)',
      lblDescription: 'Description',
      phDescription: 'Goals, research domain, and collaborating teams...',
      btnCancel: 'Cancel',
      btnCreate: 'Create Workspace',
      btnCreating: 'Creating...',
    },
    profilePage: {
      pageTitle: 'Citizen Profile & Institutional Identity',
      pageSubtitle: 'Review your verified credentials, assigned revenue jurisdictions, and sovereign authorization boundary on BHOOMI-DRISHTI.',
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Citizen Profile',
      badgeVerifiedSession: 'Verified Official Session',
      badgeInstitutional: 'National Cadastre Portal',
      btnSignOut: 'Sign Out',
      btnSigningOut: 'Signing out...',
      metricAccountStatusTitle: 'Active & Verified',
      metricAccountStatusSub: 'Citizen / Institutional Identity',
      metricPlatformRoleTitle: 'Assigned Role',
      metricPlatformRoleSub: 'Statutory Governance Clearance',
      metricJurisdictionTitle: 'Madhya Pradesh',
      metricJurisdictionSub: 'State Land Records & Revenue Portal',
      metricSecurityTitle: 'Audit-Logged TLS',
      metricSecuritySub: 'HttpOnly JWT Token Security',
      secCredentialsTitle: 'Personal Credentials & Authentication Boundary',
      secCredentialsSub: 'Official identity records and cryptographic session metadata.',
      lblFullName: 'Full Name',
      lblEmail: 'Email Address',
      lblPlatformRole: 'Platform Role',
      lblSignedInVia: 'Signed in via',
      lblAccountId: 'Citizen Session UID',
      valGoogleSso: 'Institutional Google SSO',
      valEmailPassword: 'Email and Secure Password',
      noticeSecurity: 'Your session is protected by cryptographic tokens stored in HttpOnly cookies with 256-bit TLS encryption. Client-side scripts cannot access session secrets.',
      secJurisdictionsTitle: 'Assigned Cadastral & Revenue Jurisdictions',
      secJurisdictionsSub: 'Statutory administrative boundaries configured for land record access and audit trail.',
      lblStateRevenue: 'State Revenue Department',
      valStateRevenue: 'Government of Madhya Pradesh — Revenue & Land Records Directorate',
      lblDistricts: 'Active Collectorate Districts',
      valDistricts: 'Bhopal (Division), Indore, Sehore',
      lblTehsils: 'Authorized Revenue Tehsils',
      valTehsils: 'Huzur, Rau, Sehore Rural (Khasra & Cadastral Records)',
      lblAccessScope: 'Cadastral Access Clearance',
      valAccessScope: 'Public Land Registry Search, GIS Cadastre Viewing, Digital RoR / Khasra Download, Statutory Assistant Queries',
      roleAdmin: 'System Administrator',
      roleGovOfficial: 'Government Revenue Official',
      roleResearcher: 'Cadastral Researcher',
      roleAcademia: 'Academic / Legal Scholar',
      rolePublic: 'Registered Citizen / Landholder',
    },
    homePage: {
      heroBadge1: 'National Spatial Cadastre',
      heroHeadline1: 'Every Land Parcel in India,',
      heroAccent1: 'Digitally Mapped & Verified',
      heroSub1: 'Access PostGIS WGS-84 cadastral boundaries, khasra classifications, and registered ownership deeds with tamper-evident audit guarantees.',
      heroPill1a: 'PostGIS Cadastre',
      heroPill1b: 'Spatial Polygons',
      heroPill1c: 'Instant Verification',
      heroBadge2: 'State Revenue Intelligence',
      heroHeadline2: 'State Revenue Governance',
      heroAccent2: 'at Real-time Scale',
      heroSub2: 'Monitor district-level KPIs, land revenue collection benchmarks, administrative mutation velocity, and compliance audit snapshots.',
      heroPill2a: '52 Districts',
      heroPill2b: 'Mutation Velocity',
      heroPill2c: 'Audit Trail',
      heroBadge3: 'Evidence-Grounded AI',
      heroHeadline3: 'Statutory Land Law Q&A,',
      heroAccent3: 'Grounded in Official Acts',
      heroSub3: 'Ask statutory questions on RFCTLARR 2013, state tenancy rules, and revenue codes with verbatim citation matching.',
      heroPill3a: 'Statutory Citations',
      heroPill3b: 'Zero Hallucination',
      heroPill3c: 'Legal Precedents',
      heroBadge4: 'Unified Legal Corpus',
      heroHeadline4: 'Authoritative Land Statutes',
      heroAccent4: '& Policy Frameworks',
      heroSub4: 'Explore 1,240+ digitized central and state acts, high court rulings, model leasing guidelines, and cadastral resurvey notifications.',
      heroPill4a: '1,240+ Statutes',
      heroPill4b: 'Semantic Search',
      heroPill4c: 'Model Policies',
      heroBtnExplore: 'Explore Platform',
      heroBtnLogin: 'Login / Register',
      heroBtnDashboard: 'Go to Dashboard',
      statParcelsVal: '4,280+',
      statParcelsLbl: 'Cadastral Parcels',
      statParcelsSub: 'WGS-84 PostGIS Spatial Polygons',
      statDistrictsVal: '52',
      statDistrictsLbl: 'Revenue Districts',
      statDistrictsSub: 'Monitored via State Governance Index',
      statInstrumentsVal: '1,240+',
      statInstrumentsLbl: 'Statutory Instruments',
      statInstrumentsSub: 'Acts, Revenue Circulars & Orders',
      statPrecisionVal: '99.4%',
      statPrecisionLbl: 'Evidence Precision',
      statPrecisionSub: 'Zero-Hallucination Retrieval Grounding',
      newBadge: 'Public Land Records & Instruments',
      newTitle: 'New in BHOOMI-DRISHTI',
      newSub: 'Recently digitized land records, statutory circulars, and core governance indices available for public exploration.',
      newViewAll: 'View All Records',
      newDeedTitle: 'Registered Deed & Mutation Status',
      newDeedDesc: 'Instant electronic lookup of registered land deeds, mutation notices, and khasra survey verification numbers.',
      newActTitle: 'RFCTLARR Land Acquisition Act, 2013',
      newActDesc: 'Verbatim statutory rules on rural compensation multipliers, 100% Solatium allowance, and rehabilitation entitlements.',
      newLeasingTitle: 'Model Agricultural Land Leasing Rules',
      newLeasingDesc: 'Statutory framework protecting landowners while granting institutional credit and crop compensation to tenant farmers.',
      newDilrmpTitle: 'DILRMP Cadastral Modernization',
      newDilrmpDesc: 'Standard operating procedures for computerized land records, drone-based resurvey, and spatial cadastral registration.',
      newVelocityTitle: 'District Mutation Velocity & Pendency',
      newVelocityDesc: 'Monitor administrative disposal rates, pending mutation applications, and compliance scores across 52 districts.',
      newAiTitle: 'Evidence-Grounded AI Legal Search',
      newAiDesc: 'Ask questions on state land revenue acts with guaranteed verbatim citations and strict pre-retrieval authorization.',
      ctaTitle: 'Ready to Explore Land Governance with Evidence?',
      ctaSub: 'Access spatial parcel cadastre polygons, evaluate state revenue indicators, or query statutory acts through our evidence-grounded public portal.',
      ctaBtnExplore: 'Explore Public Datasets',
      ctaBtnLogin: 'Login / Register',
      ctaBtnGovernance: 'Explore Governance',
      ctaBtnGis: 'Open GIS Map',
    },
  },
  hi: {
    header: {
      sovereignTagline: 'भूमि शासन के लिए संप्रभु डिजिटल मंच',
      govBadge: 'GOV.IN',
      fontSmall: 'फ़ॉन्ट आकार घटाएं',
      fontNormal: 'सामान्य फ़ॉन्ट आकार',
      fontLarge: 'फ़ॉन्ट आकार बढ़ाएं',
      selectLanguage: 'भाषा चुनें',
      profile: 'नागरिक प्रोफ़ाइल विवरण',
      myLandRecords: 'मेरे भू-अभिलेख',
      workspaces: 'कार्यक्षेत्र एवं सुरक्षित वॉल्ट',
      logout: 'लॉग आउट',
      explorePlatform: 'मंच अन्वेषण',
      loginRegister: 'लॉग इन / पंजीकरण',
      dashboard: 'डैशबोर्ड',
      savedResearch: 'सुरक्षित शोध',
    },
    sidebar: {
      home: 'मुख्य पृष्ठ',
      myLandRecords: 'मेरे भू-अभिलेख',
      registrySearch: 'रजिस्ट्री एवं भूकर खोज',
      workspacesVault: 'कार्यक्षेत्र और वॉल्ट',
      landGovServices: 'भूमि शासन सेवाएँ',
      gisCadastreMap: 'जीआईएस भूकर मानचित्र',
      revenueGovernance: 'राजस्व शासन रडार',
      statutoryAi: 'वैधानिक एआई सहायक',
      aboutBhoomi: 'भूमि-दृष्टि के बारे में',
      bhuvanPortal: 'भुवन इसरो भू-पोर्टल',
      portalBadge: 'ISRO',
    },
    welcome: {
      greeting: 'स्वागत है',
      subtitle: 'अपने सत्यापित भू-अभिलेख, वैधानिक दस्तावेज एवं संप्रभु स्थानिक रजिस्ट्री तक पहुंचें।',
      verifiedCitizen: 'सत्यापित नागरिक खाता',
    },
    slider: {
      heading: 'प्रमुख भू-अभिलेख एवं स्वामित्व विलेख',
      subheading: 'भारतीय राज्यों में प्रमाणित राजस्व दस्तावेज खोजें, प्राप्त करें और सत्यापित करें',
      pullDocument: 'दस्तावेज प्राप्त करें',
      rorTag: 'आधिकारिक अधिकार अभिलेख',
      rorTitle: 'खसरा - खतौनी (आरओआर)',
      rorSub: 'खसरा - खतौनी (अभिलेख)',
      rorDept: 'राजस्व एवं भू-अभिलेख विभाग',
      mutationTag: 'नामांतरण आदेश',
      mutationTitle: 'नामांतरण डिक्री एवं आदेश',
      mutationSub: 'नामांतरण आदेश एवं प्रमाण पत्र',
      mutationDept: 'तहसीलदार राजस्व न्यायालय',
      saleDeedTag: 'प्रमाणित बैनामा',
      saleDeedTitle: 'पंजीकृत विक्रय विलेख एवं स्वत्व पत्र',
      saleDeedSub: 'पंजीकृत बैनामा / विक्रय पत्र',
      saleDeedDept: 'पंजीयन एवं मुद्रांक महानिरीक्षक',
      mapTag: 'जीआईएस भूखंड सर्वेक्षण',
      mapTitle: 'स्थानिक भूकर नक्शा (भू-नक्शा)',
      mapSub: 'भू-नक्शा (डिजिटल भूखंड सीमा)',
      mapDept: 'भारतीय सर्वेक्षण विभाग / डीआईएलआरएमपी',
    },
    stateServices: {
      heading: 'नवीन एकीकृत राज्य सेवाएँ',
      subheading: 'राज्य डिजिटल भू-अभिलेख प्राधिकरणों के साथ स्वचालित लाइव समन्वय',
      viewAll: 'सभी सेवाएँ देखें',
      availableNow: 'उपलब्ध है',
      mpTitle: 'पंजीकृत विक्रय विलेख',
      mpSub: 'पंजीकृत विक्रय विलेख (मध्य प्रदेश)',
      mpDept: 'पंजीयन एवं मुद्रांक विभाग, म.प्र.',
      upTitle: 'खसरा - खतौनी (बी-1)',
      upSub: 'खसरा - खतौनी भू-अभिलेख (उ.प्र.)',
      upDept: 'राजस्व परिषद, उत्तर प्रदेश (भूलेख)',
      mhTitle: 'फेरफार / नामांतरण आदेश',
      mhSub: 'फेरफार / ७/१२ उतारा',
      mhDept: 'भूमि अभिलेख संचालनालय, महाराष्ट्र',
      gjTitle: 'भू-संदर्भित डिजिटल भू-नक्शा',
      gjSub: 'डिजिटल गांव नक्शा एवं सीमा',
      gjDept: 'भूमि अभिलेख अधीक्षक, गुजरात',
    },
    issuedRecords: {
      heading: 'मेरे जारी किए गए भू-दस्तावेज एवं सत्यापित भूखंड',
      subheading: 'आपके राजस्व खाते से जुड़े सक्रिय स्वामित्व विलेख एवं भूकर पार्सल',
      viewAll: 'सभी देखें',
      activeStatus: 'सक्रिय',
      gisMap: 'जीआईएस नक्शा',
      askAi: 'एआई से पूछें',
      areaHectares: 'हेक्टेयर',
      noRecordsTitle: 'कोई जारी भू-दस्तावेज नहीं मिला',
      noRecordsDesc: 'आपने अभी तक अपने नागरिक खाते से कोई भूखंड लिंक नहीं किया है।',
      exploreRegistry: 'रजिस्ट्री खोजें',
    },
    quickTools: {
      heading: 'मंच क्षमताएँ एवं त्वरित साधन',
      subheading: 'मूल स्थानिक, प्रशासनिक और एआई बुद्धिमत्ता इंजनों तक सीधी पहुंच',
      launchEngine: 'इंजन प्रारंभ करें',
      gisTitle: 'जीआईएस भूकर अन्वेषक',
      gisTag: 'स्थानिक रजिस्ट्री',
      gisDesc: 'भू-संदर्भित सीमाओं, उपग्रह बेस लेयर्स और वास्तविक समय भूखंड ओवरले का अन्वेषण करें।',
      govTitle: 'राजस्व शासन रडार',
      govTag: 'लाइव केपीआई रडार',
      govDesc: 'जिला-स्तरीय नामांतरण गति, विवाद बैकलॉग और पारदर्शिता सूचकांकों को ट्रैक करें।',
      aiTitle: 'वैधानिक एआई सहायक',
      aiTag: 'विधिक बुद्धिमत्ता',
      aiDesc: 'भूमि सुधार कानूनों, आरएफसीटीएलएआरआर 2013, रेरा और मॉडल किराएदारी अधिनियम के प्रावधानों पर परामर्श लें।',
      vaultTitle: 'कार्यक्षेत्र एवं नीति वॉल्ट',
      vaultTag: 'सहयोगात्मक कार्यक्षेत्र',
      vaultDesc: 'नीति सिमुलेशन, भूमि अधिग्रहण मामलों और संस्थागत अनुसंधान परियोजनाओं पर सहयोग करें।',
    },
    landRecordsPage: {
      pageTitle: 'मेरे भू-अभिलेख एवं स्वामित्व विलेख',
      pageSubtitle: 'प्रमाणित अधिकार अभिलेख (आरओआर), भूकर पार्सल एवं वैधानिक स्वामित्व दस्तावेज',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'मेरे भू-अभिलेख',
      addRecordBtn: 'नया भूखंड रिकॉर्ड जोड़ें',
      spatialSearchBtn: 'स्थानिक सीमांकन फ़िल्टर',
      resetFiltersBtn: 'फ़िल्टर रीसेट करें',
      searchPlaceholder: 'भूखंड संख्या, यूएलपीआईएन, गांव द्वारा खोजें...',
      allStates: 'सभी भारतीय राज्य',
      filterDistrict: 'जिले के अनुसार फ़िल्टर करें...',
      allLandUse: 'सभी भूमि उपयोग',
      allStatuses: 'सभी स्थितियां',
      cardView: 'कार्ड दृश्य',
      tableView: 'रजिस्ट्री तालिका',
      metricTotalParcels: 'कुल सत्यापित भूखंड',
      metricTotalArea: 'संचयी क्षेत्रफल',
      metricActiveTitles: 'सक्रिय प्रमाणित विलेख',
      metricStatesCovered: 'शामिल क्षेत्राधिकार',
      colParcel: 'पार्सल संख्या / यूएलपीआईएन',
      colLocation: 'गांव एवं जिला',
      colArea: 'क्षेत्रफल (हेक्टेयर)',
      colLandUse: 'भूमि वर्गीकरण',
      colStatus: 'वैधानिक स्थिति',
      colActions: 'कार्यवाही',
      actionViewDetails: 'अभिलेख देखें',
      actionGisMap: 'जीआईएस नक्शा',
      actionAskAi: 'एआई से पूछें',
      actionEdit: 'संपादित करें',
      actionDelete: 'हटाएं',
      emptyTitle: 'कोई भू-अभिलेख नहीं मिला',
      emptyDesc: 'आपके फ़िल्टर से मेल खाता कोई रिकॉर्ड उपलब्ध नहीं है। कृपया अपनी खोज बदलें।',
    },
    explorePage: {
      pageTitle: 'रजिस्ट्री एवं भूकर खोज',
      pageSubtitle: 'भूमि सुधार कानूनों, राज्य भूकर एवं राजस्व निर्णयों के लिए सार्वभौमिक खोज इंजन',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'रजिस्ट्री एवं भूकर खोज',
      searchPlaceholder: 'अधिनियम का नाम, धारा, किराएदारी नियम, या शब्द द्वारा खोजें...',
      allTypes: 'सभी दस्तावेज प्रकार',
      typeStatute: 'अधिनियम / कानून',
      typeOrder: 'न्यायिक आदेश',
      typePolicy: 'नीति पत्र',
      typeCircular: 'राजस्व परिपत्र',
      allStates: 'सभी क्षेत्राधिकार',
      resetFiltersBtn: 'फ़िल्टर रीसेट करें',
      metricStatutes: 'प्रकाशित अधिनियम',
      metricStates: 'राज्य भूकर',
      metricPrecedents: 'विधिक निर्णय',
      metricAiIndex: 'एआई ज्ञान अनुक्रमणिका',
      statePortalsHeading: 'राज्य भूकर रजिस्ट्रियाँ एवं राजस्व पोर्टल',
      statePortalsSub: 'राज्य डिजिटल भू-अभिलेख डेटाबेस तक सीधी पहुंच',
      resultsHeading: 'वैधानिक खोज परिणाम एवं दस्तावेज',
      thematicHeading: 'भूमि शासन के विषयगत स्तंभ',
      thematicSub: 'प्रमुख नीतिगत ढांचा और विधायी क्षेत्र',
      actionViewDoc: 'दस्तावेज देखें',
      actionAskAi: 'एआई से विश्लेषण करें',
      askAiPrompt: 'वैधानिक एआई से पूछें',
    },
    gisPage: {
      pageTitle: 'स्थानिक भू-नक्शा एवं भूखंड जीआईएस अन्वेषक',
      pageSubtitle: 'पोस्टजीआईएस स्थानिक भूखंड सीमाएं, भूमि उपयोग ज़ोनिंग और प्रमाणित स्वामित्व ज्यामिति प्रदर्शित करने वाला उच्च-रिज़ॉल्यूशन मानचित्र।',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'जीआईएस भू-नक्शा',
      filterBtn: 'जीआईएस स्थानिक फिल्टर',
      resetViewBtn: 'स्थानिक दृश्य रीसेट करें',
      legendTitle: 'भू-नक्शा संकेतक',
      metricLoadedParcels: 'दृश्य में लोड भूखंड',
      metricSpatialEngine: 'पोस्टजीआईएस स्थानिक इंजन',
      metricZoomStatus: 'भू-नक्शा रिज़ॉल्यूशन',
      metricSurveyStandard: 'भारतीय सर्वेक्षण विभाग मानक',
      zoomWarning: 'भूखंड सीमाएं लोड करने के लिए लेवल 12+ तक ज़ूम इन करें।',
      truncatedWarning: 'दृश्य सीमित: स्थानीय भूखंडों के विस्तृत निरीक्षण के लिए ज़ूम इन करें।',
      fetchingLayer: 'स्थानिक परत लोड हो रही है...',
      quickLocations: 'त्वरित भूकर स्थान:',
      locBhopal: 'भोपाल (हुजूर तहसील)',
      locIndore: 'इंदौर (राऊ तहसील)',
      locSehore: 'सीहोर (कृषि भू-नक्शा)',
      layerAgricultural: 'कृषि भूमि',
      layerResidential: 'आवासीय भूखंड',
      layerCommercial: 'वाणिज्यिक क्षेत्र',
      layerIndustrial: 'औद्योगिक क्षेत्र',
      layerForest: 'वन एवं पर्यावरण संरक्षित',
      layerWaterBody: 'जल निकाय एवं नदी',
      layerDisputed: 'विवादित / भारग्रस्त',
      drawerTitle: 'भूखंड भू-अभिलेख विवरण',
      tabSpatialDetails: 'स्थानिक विशेषताएं',
      tabLinkedResearch: 'संबद्ध अनुसंधान व विलेख',
      tabAiEvidence: 'एआई कानूनी साक्ष्य व मिसालें',
      btnLinkProject: 'परियोजना से जोड़ें',
      btnCopyGeoJson: 'पोस्टजीआईएस जियोजेसन कॉपी करें',
      btnZoomParcel: 'मानचित्र पर भूखंड केंद्रित करें',
      lblParcelId: 'खसरा / भूखंड संख्या',
      lblOwner: 'अभिलेखित खाताधारक',
      lblArea: 'भूकर क्षेत्रफल',
      lblLandUse: 'भूमि उपयोग वर्गीकरण',
      lblStatus: 'स्वामित्व एवं नामांतरण स्थिति',
      lblCoordinates: 'भूखंड केंद्र निर्देशांक',
    },
    governancePage: {
      pageTitle: 'राजस्व शासन रडार एवं वैधानिक मानक',
      pageSubtitle: 'वास्तविक समय भूमि शासन संकेतक, नामांतरण गति, विवाद वितरण और वैधानिक अनुपालन ऑडिट बेसलाइन।',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'राजस्व शासन रडार',
      temporalCompareBtn: 'कालिक राज्य तुलना',
      refreshBtn: 'मेट्रिक्स रीफ्रेश करें',
      badgeLive: 'लाइव पोस्टजीआईएस गणना',
      badgeFramework: 'एनआईसी शासन ढांचा',
      metricDigitizationTitle: 'भू-अभिलेख डिजिटलीकरण',
      metricDigitizationSub: 'देशभर में कम्प्यूटरीकृत खतौनी',
      metricMutationTitle: 'औसत नामांतरण गति',
      metricMutationSub: 'वैधानिक निस्तारण का औसत समय',
      metricPostGisSyncTitle: 'स्थानिक भू-नक्शा सिंक',
      metricPostGisSyncSub: 'संबद्ध राज्य एवं केंद्र शासित प्रदेश',
      metricAuditTrailTitle: 'वैधानिक ऑडिट ट्रेल',
      metricAuditTrailSub: 'अपरिवर्तनीय बेसलाइन स्नैपशॉट',
      scopeNational: 'राष्ट्रीय अवलोकन',
      scopeState: 'राज्य शासन',
      scopeDistrict: 'जिला समाहरणालय',
      scopeTehsil: 'तहसील राजस्व न्यायालय',
      scopeVillage: 'ग्राम भूकर',
      tabExecutiveSummary: 'कार्यकारी शासन रडार',
      tabDetailedMetrics: 'विस्तृत संकेतक आव्यूह',
      tabAuditSnapshots: 'ऑडिट स्नैपशॉट अभिलेखागार',
      btnCaptureSnapshot: 'ऑडिट स्नैपशॉट सुरक्षित करें',
      lblActiveBaseline: 'सक्रिय भूकर संकलन',
    },
    assistantPage: {
      pageTitle: 'प्रमाण-आधारित वैधानिक एआई सहायक',
      pageSubtitle: 'सत्यापित वैधानिक परिपत्रों, नीति नियमावलियों और भूकर अनुसंधान दस्तावेजों पर आधारित संवादात्मक विधिक विश्लेषण।',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'वैधानिक एआई सहायक',
      badgeAiSynthesis: 'वैधानिक एआई संश्लेषण',
      advisoryNotice: 'वैधानिक अनुसंधान सूचना',
      advisoryDisclaimer: 'भूमी-दृष्टि ज्ञान भंडार में अधिकृत दस्तावेजों के आधार पर साक्ष्य-समर्थित निष्कर्ष प्रस्तुत करता है। यह प्रमाणित विधिक सलाह या राजस्व न्यायालय के अंतिम आदेश का विकल्प नहीं है।',
      activeContextLabel: 'सक्रिय वैधानिक संदर्भ:',
      activeContextDesc: 'एआई खोज और वैधानिक संश्लेषण केवल इसी चयनित संसाधन तक सीमित और आधारित रहेंगे।',
      btnClearContext: 'संदर्भ हटाएं',
      queryInputPlaceholder: 'वैधानिक नियमों, भूकर मानकों अथवा भूमि प्रशासन प्रावधानों से संबंधित प्रश्न पूछें...',
      btnAskAssistant: 'सहायक से पूछें',
      btnSynthesizing: 'संश्लेषण जारी है...',
      btnScopeFilter: 'दायरा फ़िल्टर',
      filterTargetDocType: 'लक्षित दस्तावेज़ प्रकार:',
      optAllDocTypes: 'सभी दस्तावेज़ प्रकार',
      optResearchPaper: 'शोध पत्र (Research Paper)',
      optPolicyDocument: 'नीति दस्तावेज़ (Policy Document)',
      optGovReport: 'सरकारी रिपोर्ट (Government Report)',
      optAcademicPub: 'शैक्षणिक प्रकाशन (Academic)',
      optLegalDoc: 'विधिक दस्तावेज़ (Legal Document)',
      metricStatutesIndexedTitle: '1,420+ अधिनियम एवं परिपत्र',
      metricStatutesIndexedSub: 'म.प्र. भू-राजस्व संहिता व वन अधिकार',
      metricGroundingThresholdTitle: 'सख्त सत्यापन सीमा',
      metricGroundingThresholdSub: 'शून्य काल्पनिक त्रुटि (Zero Hallucination)',
      metricAvgLatencyTitle: 'औसत प्रतिक्रिया गति',
      metricAvgLatencySub: '~1.2 सेकंड सिमेंटिक खोज',
      metricZeroHallucinationTitle: 'वैधानिक प्रामाणिकता',
      metricZeroHallucinationSub: '100% सत्यापन योग्य स्रोत अंश',
      emptyTitle: 'साक्ष्य-आधारित वैधानिक एवं नीतिगत बुद्धिमत्ता',
      emptySubtitle: 'विशिष्ट वैधानिक या भूमि शासन संबंधी प्रश्न पूछें। प्रत्येक उत्तर प्रकाशित शोध प्रलेखों, परिपत्रों और सर्वेक्षण नियमावलियों से प्रमाणित है।',
      featureStrictGroundingTitle: 'सख्त साक्ष्य आधार',
      featureStrictGroundingSub: 'सहायक केवल सत्यापित अंशों पर उत्तर तैयार करता है। अपर्याप्त साक्ष्य मिलने पर स्वतः सुरक्षा गेटिंग लागू होती है।',
      featureInteractiveProvenanceTitle: 'इंटरैक्टिव स्रोत संदर्भ',
      featureInteractiveProvenanceSub: 'प्रत्येक उद्धरण डेटाबेस के सटीक पृष्ठ, धारा शीर्षक और प्रकाशन विवरण को संदर्भित करता है।',
      featureZeroHallucinationTitle: 'काल्पनिक उद्धरणों का पूर्ण अभाव',
      featureZeroHallucinationSub: 'अपुष्ट या गढ़े गए उद्धरणों को उत्तर प्रदर्शित होने से पहले सर्वर स्तर पर हटा दिया जाता है।',
      suggestedQueriesTitle: 'सुझाए गए वैधानिक प्रश्न',
      catLandTransfer: 'भूमि अंतरण विनियम',
      queryLandTransfer: 'कृषि भूमि अंतरण पर कौन से वैधानिक प्रावधान लागू होते हैं?',
      catCadastralStandards: 'भूकर परिशुद्धता मानक',
      queryCadastralStandards: 'ड्रोन सर्वेक्षण हेतु भूकर सीमा शुद्धता के क्या मानक हैं?',
      catRecordOfRights: 'अधिकार अभिलेख (खसरा/खतौनी)',
      queryRecordOfRights: 'अधिकार अभिलेख डिजिटलीकरण हेतु किन दस्तावेजों में दिशा-निर्देश हैं?',
      catForestTribalRights: 'वन एवं जनजातीय भूमि अधिकार',
      queryForestTribalRights: 'जनजातीय पट्टा एवं वन अधिकारों से संबंधित विधिक ढांचा क्या है?',
      assistantResponseHeading: 'वैधानिक सहायक प्रत्युत्तर',
      auditDiagnostics: 'ऑडिट एवं पुनःप्राप्ति विश्लेषण',
      verifiedCitationsCount: 'सत्यापित उद्धरण',
      queryEchoPrefix: 'प्रश्न:',
    },
    workspacesPage: {
      pageTitle: 'अनुसंधान कार्यक्षेत्र एवं संप्रभु वॉल्ट',
      pageSubtitle: 'भूमि शासन अनुसंधान, जीआईएस भूकर पार्सल विश्लेषण, नीति परिदृश्य मॉडलिंग और साझा सत्यापित डेटासेट हेतु संस्थागत केंद्र।',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'कार्यक्षेत्र और वॉल्ट',
      badgeCollaborative: 'सहयोगात्मक वातावरण',
      badgeVault: 'संप्रभु अनुसंधान वॉल्ट',
      btnNewWorkspace: 'नया कार्यक्षेत्र बनाएं',
      tabAll: 'सभी संस्थागत कार्यक्षेत्र',
      tabMy: 'मेरे सक्रिय कार्यक्षेत्र',
      metricTotalWorkspacesTitle: 'संस्थागत कार्यक्षेत्र',
      metricTotalWorkspacesSub: 'राजस्व, सर्वेक्षण एवं अकादमिक',
      metricActiveProjectsTitle: 'सहयोगी परियोजनाएं',
      metricActiveProjectsSub: 'भूकर एवं भूमि अभिलेख',
      metricLinkedParcelsTitle: 'संबद्ध भूकर पार्सल',
      metricLinkedParcelsSub: 'पोस्टजीआईएस स्थानिक बाइंडिंग',
      metricAuditReadyTitle: 'भूमिका-आधारित आरबीएसी वॉल्ट',
      metricAuditReadySub: 'वैधानिक अपरिवर्तनीय ऑडिट',
      emptyTitle: 'कोई कार्यक्षेत्र नहीं मिला',
      emptySubAll: 'वर्तमान में कोई सार्वजनिक कार्यक्षेत्र उपलब्ध नहीं है।',
      emptySubMy: 'आप अभी तक किसी भी कार्यक्षेत्र में शामिल नहीं हुए हैं या कोई कार्यक्षेत्र नहीं बनाया है।',
      btnCreateFirst: 'अपना पहला कार्यक्षेत्र बनाएं',
      cardPublic: 'सार्वजनिक',
      cardPrivate: 'निजी',
      cardMember: 'सदस्य',
      cardMembers: 'सदस्य',
      cardProject: 'परियोजना',
      cardProjects: 'परियोजनाएं',
      cardOpen: 'कार्यक्षेत्र खोलें',
      cardNoDesc: 'कोई विवरण प्रदान नहीं किया गया।',
      modalTitle: 'अनुसंधान कार्यक्षेत्र बनाएं',
      modalSub: 'शोध परियोजनाओं, डेटासेट और जीआईएस पार्सल विश्लेषण हेतु एक संस्थागत केंद्र स्थापित करें।',
      lblWorkspaceName: 'कार्यक्षेत्र का नाम *',
      phWorkspaceName: 'उदा. मध्य प्रदेश भूमि शासन अनुसंधान केंद्र',
      lblInstitution: 'संस्थान / संगठन',
      phInstitution: 'उदा. भूमि संसाधन विभाग / आईआईटी इंदौर',
      lblVisibility: 'पहुँच दृश्यता',
      optPrivate: 'निजी (केवल सदस्य एवं अधिकारी)',
      optPublic: 'सार्वजनिक (सभी के लिए सुलभ)',
      lblDescription: 'विवरण',
      phDescription: 'लक्ष्य, अनुसंधान क्षेत्र एवं सहयोगी दल...',
      btnCancel: 'रद्द करें',
      btnCreate: 'कार्यक्षेत्र बनाएं',
      btnCreating: 'बनाया जा रहा है...',
    },
    profilePage: {
      pageTitle: 'नागरिक प्रोफाइल एवं संस्थागत पहचान',
      pageSubtitle: 'भूमि-दृष्टि पर अपने सत्यापित प्रमाण-पत्र, आवंटित राजस्व अधिकार क्षेत्र और संप्रभु प्राधिकरण सीमा की समीक्षा करें।',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'नागरिक प्रोफाइल',
      badgeVerifiedSession: 'सत्यापित आधिकारिक सत्र',
      badgeInstitutional: 'राष्ट्रीय भू-अभिलेख पोर्टल',
      btnSignOut: 'लॉग आउट',
      btnSigningOut: 'लॉग आउट हो रहा है...',
      metricAccountStatusTitle: 'सक्रिय एवं सत्यापित',
      metricAccountStatusSub: 'नागरिक / संस्थागत पहचान',
      metricPlatformRoleTitle: 'आवंटित पद / भूमिका',
      metricPlatformRoleSub: 'वैधानिक शासन अनुमति',
      metricJurisdictionTitle: 'मध्य प्रदेश',
      metricJurisdictionSub: 'राज्य भू-अभिलेख एवं राजस्व पोर्टल',
      metricSecurityTitle: 'ऑडिट-लॉग टीएलएस',
      metricSecuritySub: 'HttpOnly JWT टोकन सुरक्षा',
      secCredentialsTitle: 'व्यक्तिगत क्रेडेंशियल एवं प्रमाणीकरण सीमा',
      secCredentialsSub: 'आधिकारिक पहचान रिकॉर्ड और क्रिप्टोग्राफ़िक सत्र मेटाडेटा।',
      lblFullName: 'पूरा नाम',
      lblEmail: 'ईमेल पता',
      lblPlatformRole: 'मंच भूमिका',
      lblSignedInVia: 'प्रमाणीकरण का माध्यम',
      lblAccountId: 'नागरिक सत्र यूआईडी',
      valGoogleSso: 'संस्थागत गूगल एसएसओ (Google SSO)',
      valEmailPassword: 'ईमेल एवं सुरक्षित पासवर्ड',
      noticeSecurity: 'आपका सत्र 256-बिट टीएलएस एन्क्रिप्शन के साथ HttpOnly कुकीज़ में संग्रहीत क्रिप्टोग्राफ़िक टोकन द्वारा सुरक्षित है। क्लाइंट-साइड स्क्रिप्ट टोकन तक पहुँच नहीं सकतीं।',
      secJurisdictionsTitle: 'आवंटित भू-कर एवं राजस्व अधिकार क्षेत्र',
      secJurisdictionsSub: 'भू-अभिलेख पहुँच एवं ऑडिट ट्रेल हेतु निर्धारित वैधानिक प्रशासनिक सीमाएं।',
      lblStateRevenue: 'राज्य राजस्व विभाग',
      valStateRevenue: 'मध्य प्रदेश शासन — राजस्व एवं भू-अभिलेख संचनालय',
      lblDistricts: 'सक्रिय कलेक्ट्रेट जिले',
      valDistricts: 'भोपाल (संभाग), इंदौर, सीहोर',
      lblTehsils: 'अधिकृत राजस्व तहसीलें',
      valTehsils: 'हुजूर, राऊ, सीहोर ग्रामीण (खसरा एवं भूकर मानचित्र)',
      lblAccessScope: 'भू-कर अभिलेख अनुमति स्तर',
      valAccessScope: 'सार्वजनिक भूमि रजिस्ट्री खोज, जीआईएस भूकर मानचित्रण, डिजिटल खतौनी/खसरा डाउनलोड, वैधानिक एआई परामर्श',
      roleAdmin: 'प्रणाली प्रशासक',
      roleGovOfficial: 'शासकीय राजस्व अधिकारी',
      roleResearcher: 'भू-अभिलेख शोधकर्ता',
      roleAcademia: 'शैक्षणिक / विधि विद्वान',
      rolePublic: 'पंजीकृत नागरिक / खातेदार',
    },
    homePage: {
      heroBadge1: 'राष्ट्रीय स्थानिक भूकर',
      heroHeadline1: 'भारत का प्रत्येक भूमि पार्सल,',
      heroAccent1: 'डिजिटल रूप से मैप और सत्यापित',
      heroSub1: 'PostGIS WGS-84 भूकर सीमाएं, खसरा वर्गीकरण, और छेड़छाड़-रहित ऑडिट गारंटी के साथ पंजीकृत स्वामित्व विलेख प्राप्त करें।',
      heroPill1a: 'पोस्टजीआईएस भूकर',
      heroPill1b: 'स्थानिक बहुभुज',
      heroPill1c: 'त्वरित सत्यापन',
      heroBadge2: 'राज्य राजस्व आसूचना',
      heroHeadline2: 'राज्य राजस्व शासन',
      heroAccent2: 'वास्तविक समय पैमाने पर',
      heroSub2: 'जिला-स्तरीय केपीआई, भू-राजस्व संग्रह मानक, नामांतरण गति, और अनुपालन ऑडिट स्नैपशॉट की निगरानी करें।',
      heroPill2a: '52 जिले',
      heroPill2b: 'नामांतरण गति',
      heroPill2c: 'ऑडिट ट्रेल',
      heroBadge3: 'साक्ष्य-आधारित एआई',
      heroHeadline3: 'वैधानिक भूमि कानून प्रश्नोत्तरी,',
      heroAccent3: 'आधिकारिक अधिनियमों पर आधारित',
      heroSub3: 'RFCTLARR 2013, राज्य काश्तकारी नियमों और राजस्व संहिताओं पर सटीक उद्धरण मिलान के साथ प्रश्न पूछें।',
      heroPill3a: 'वैधानिक उद्धरण',
      heroPill3b: 'शून्य भ्रांति',
      heroPill3c: 'न्यायिक मिसालें',
      heroBadge4: 'एकीकृत कानूनी कोष',
      heroHeadline4: 'प्रामाणिक भूमि कानून',
      heroAccent4: 'एवं नीतिगत ढांचे',
      heroSub4: '1,240+ डिजिटाइज़्ड केंद्रीय व राज्य अधिनियम, उच्च न्यायालय के निर्णय, मॉडल लीजिंग दिशानिर्देश और अधिसूचनाएं देखें।',
      heroPill4a: '1,240+ कानून',
      heroPill4b: 'सिमेंटिक खोज',
      heroPill4c: 'मॉडल नीतियां',
      heroBtnExplore: 'मंच देखें',
      heroBtnLogin: 'लॉग इन / पंजीकरण',
      heroBtnDashboard: 'डैशबोर्ड पर जाएं',
      statParcelsVal: '4,280+',
      statParcelsLbl: 'भूकर पार्सल',
      statParcelsSub: 'WGS-84 पोस्टजीआईएस स्थानिक बहुभुज',
      statDistrictsVal: '52',
      statDistrictsLbl: 'राजस्व जिले',
      statDistrictsSub: 'राज्य शासन सूचकांक द्वारा मॉनिटर',
      statInstrumentsVal: '1,240+',
      statInstrumentsLbl: 'वैधानिक दस्तावेज',
      statInstrumentsSub: 'अधिनियम, राजस्व परिपत्र एवं आदेश',
      statPrecisionVal: '99.4%',
      statPrecisionLbl: 'साक्ष्य सटीकता',
      statPrecisionSub: 'शून्य-भ्रांति पुनर्प्राप्ति ग्राउंडिंग',
      newBadge: 'सार्वजनिक भू-अभिलेख एवं दस्तावेज',
      newTitle: 'भूमि-दृष्टि में नया',
      newSub: 'सार्वजनिक अन्वेषण हेतु हाल ही में डिजिटलीकृत भू-अभिलेख, वैधानिक परिपत्र और शासन सूचकांक उपलब्ध हैं।',
      newViewAll: 'सभी रिकॉर्ड देखें',
      newDeedTitle: 'पंजीकृत विलेख एवं नामांतरण स्थिति',
      newDeedDesc: 'पंजीकृत विलेखों, नामांतरण सूचनाओं और खसरा सर्वेक्षण सत्यापन की तत्काल इलेक्ट्रॉनिक जांच।',
      newActTitle: 'RFCTLARR भूमि अधिग्रहण अधिनियम, 2013',
      newActDesc: 'ग्रामीण मुआवजा गुणक, 100% तोषणा भत्ता और पुनर्वास अधिकारों के मूल वैधानिक नियम।',
      newLeasingTitle: 'मॉडल कृषि भूमि पट्टा नियम',
      newLeasingDesc: 'भूमि स्वामियों के अधिकारों की रक्षा करते हुए काश्तकारों को संस्थागत ऋण व फसल मुआवजा दिलाने वाला ढांचा।',
      newDilrmpTitle: 'DILRMP भूकर आधुनिकीकरण',
      newDilrmpDesc: 'कम्प्यूटरीकृत भू-अभिलेख, ड्रोन-आधारित पुनः सर्वेक्षण और स्थानिक भूकर पंजीकरण हेतु मानक संचालन प्रक्रियाएं।',
      newVelocityTitle: 'जिला नामांतरण गति एवं लंबित मामले',
      newVelocityDesc: '52 जिलों में प्रशासनिक निपटान दर, लंबित नामांतरण आवेदन और अनुपालन स्कोर की निगरानी करें।',
      newAiTitle: 'साक्ष्य-आधारित एआई कानूनी खोज',
      newAiDesc: 'गारंटीकृत मूल उद्धरणों और सख्त प्राधिकरण के साथ राज्य भूमि राजस्व अधिनियमों पर प्रश्न पूछें।',
      ctaTitle: 'साक्ष्यों के साथ भूमि शासन का अन्वेषण करने के लिए तैयार हैं?',
      ctaSub: 'हमारे साक्ष्य-आधारित सार्वजनिक पोर्टल के माध्यम से स्थानिक पार्सल बहुभुज, राज्य राजस्व संकेतक या वैधानिक अधिनियम देखें।',
      ctaBtnExplore: 'सार्वजनिक डेटासेट देखें',
      ctaBtnLogin: 'लॉग इन / पंजीकरण',
      ctaBtnGovernance: 'राजस्व शासन देखें',
      ctaBtnGis: 'जीआईएस मानचित्र खोलें',
    },
  },
  mr: {
    header: {
      sovereignTagline: 'जमीन प्रशासनासाठी सार्वभौम डिजिटल व्यासपीठ',
      govBadge: 'GOV.IN',
      fontSmall: 'फॉन्ट आकार कमी करा',
      fontNormal: 'मूळ फॉन्ट आकार',
      fontLarge: 'फॉन्ट आकार वाढवा',
      selectLanguage: 'भाषा निवडा',
      profile: 'नागरिक प्रोफाइल तपशील',
      myLandRecords: 'माझे जमीन महसूल अभिलेख',
      workspaces: 'कार्यक्षेत्र आणि सुरक्षित वॉल्ट',
      logout: 'बाहेर पडा',
      explorePlatform: 'प्लॅटफॉर्म एक्सप्लोर करा',
      loginRegister: 'लॉग इन / नोंदणी',
      dashboard: 'डॅशबोर्ड',
      savedResearch: 'जतन केलेले संशोधन',
    },
    sidebar: {
      home: 'मुख्य पान',
      myLandRecords: 'माझे जमीन महसूल अभिलेख',
      registrySearch: 'नोंदणी आणि भूकर शोध',
      workspacesVault: 'कार्यक्षेत्र आणि सुरक्षित वॉल्ट',
      landGovServices: 'जमीन प्रशासन सेवा',
      gisCadastreMap: 'जीआयएस भूकर नकाशा',
      revenueGovernance: 'महसूल प्रशासन रडार',
      statutoryAi: 'वैधानिक एआय सहाय्यक',
      aboutBhoomi: 'भूमी-दृष्टी बद्दल',
      bhuvanPortal: 'भुवन इस्रो भू-पोर्टल',
      portalBadge: 'ISRO',
    },
    welcome: {
      greeting: 'स्वागत आहे',
      subtitle: 'तुमचे सत्यापित जमीन अभिलेख, वैधानिक दस्तऐवज आणि सार्वभौम स्थानिक नोंदणी पहा.',
      verifiedCitizen: 'सत्यापित नागरिक खाते',
    },
    slider: {
      heading: 'प्रमुख जमीन महसूल व मालकी हक्क दस्तऐवज',
      subheading: 'विविध राज्यांमधील प्रमाणित महसूल दस्तऐवज शोधा, डाउनलोड करा आणि सत्यापित करा',
      pullDocument: 'दस्तऐवज मिळवा',
      rorTag: 'अधिकृत सातबारा उतारा',
      rorTitle: 'सातबारा / ८-अ उतारा (RoR)',
      rorSub: 'खसरा - खतावणी (सातबारा)',
      rorDept: 'महसूल व भूमी अभिलेख विभाग',
      mutationTag: 'फेरफार आदेश',
      mutationTitle: 'फेरफार हुकूम व नोंदणी प्रमाणपत्र',
      mutationSub: 'फेरफार आदेश व प्रमाणपत्र',
      mutationDept: 'तहसीलदार महसूल न्यायालय',
      saleDeedTag: 'प्रमाणित खरेदीखत',
      saleDeedTitle: 'नोंदणीकृत खरेदीखत व मालकी हक्क',
      saleDeedSub: 'नोंदणीकृत खरेदीखत / विक्रीपत्र',
      saleDeedDept: 'नोंदणी महानिरीक्षक व मुद्रांक नियंत्रक',
      mapTag: 'जीआयएस भूखंड सर्वेक्षण',
      mapTitle: 'स्थानिक डिजिटल भू-नकाशा',
      mapSub: 'भू-नकाशा (डिजिटल सीमांकन)',
      mapDept: 'भारतीय सर्वेक्षण विभाग / भूमी अभिलेख',
    },
    stateServices: {
      heading: 'नवीन समाविष्ट राज्य सेवा',
      subheading: 'राज्य डिजिटल जमीन अभिलेख प्राधिकरणांसोबत थेट डिजिटल समन्वय',
      viewAll: 'सर्व सेवा पहा',
      availableNow: 'आता उपलब्ध',
      mpTitle: 'नोंदणीकृत विक्री दस्तऐवज',
      mpSub: 'नोंदणीकृत विक्री दस्तऐवज (मध्य प्रदेश)',
      mpDept: 'नोंदणी व मुद्रांक विभाग, मध्य प्रदेश',
      upTitle: 'खसरा - खतावणी (बी-१)',
      upSub: 'खसरा - खतावणी भू-अभिलेख (उत्तर प्रदेश)',
      upDept: 'महसूल मंडळ, उत्तर प्रदेश (भूलेख)',
      mhTitle: 'फेरफार / ७/१२ डिजिटल उतारा',
      mhSub: 'फेरफार / ७/१२ उतारा (महाराष्ट्र)',
      mhDept: 'भूमी अभिलेख संचालनालय, महाराष्ट्र',
      gjTitle: 'भू-संदर्भित डिजिटल गाव नकाशा',
      gjSub: 'डिजिटल गाव नकाशा व सीमा (गुजरात)',
      gjDept: 'भूमी अभिलेख अधीक्षक, गुजरात',
    },
    issuedRecords: {
      heading: 'माझे जारी केलेले जमीन दस्तऐवज आणि सत्यापित भूखंड',
      subheading: 'तुमच्या महसूल खात्याशी जोडलेले सक्रिय मालकी हक्क व भूखंड',
      viewAll: 'सर्व पहा',
      activeStatus: 'सक्रिय',
      gisMap: 'जीआयएस नकाशा',
      askAi: 'एआय विचारा',
      areaHectares: 'हेक्टर',
      noRecordsTitle: 'कोणतेही जारी केलेले दस्तऐवज सापडले नाहीत',
      noRecordsDesc: 'तुम्ही अद्याप तुमच्या नागरिक खात्याशी कोणतेही भूखंड जोडलेले नाहीत.',
      exploreRegistry: 'नोंदणी शोधा',
    },
    quickTools: {
      heading: 'प्लॅटफॉर्म क्षमता आणि जलद साधने',
      subheading: 'स्थानिक, प्रशासकीय आणि एआय बुद्धिमत्ता प्रणालींमध्ये थेट प्रवेश',
      launchEngine: 'प्रणाली सुरू करा',
      gisTitle: 'जीआयएस भूकर शोध प्रणाली',
      gisTag: 'स्थानिक नोंदणी',
      gisDesc: 'भू-संदर्भित सीमा, उपग्रह थर आणि रीअल-टाइम भूखंड नकाशा पहा.',
      govTitle: 'महसूल प्रशासन रडार',
      govTag: 'थेट केपीआय रडार',
      govDesc: 'जिल्हास्तरीय फेरफार गती, प्रलंबित वाद आणि पारदर्शकता निर्देशांक तपासा.',
      aiTitle: 'वैधानिक एआय सहाय्यक',
      aiTag: 'कायदेशीर बुद्धिमत्ता',
      aiDesc: 'जमीन सुधारणा कायदे, भूसंपादन कायदा, रेरा आणि मॉडेल भाडेकरू कायद्यावर सल्ला घ्या.',
      vaultTitle: 'कार्यक्षेत्र आणि धोरण वॉल्ट',
      vaultTag: 'सहयोगी कार्यक्षेत्र',
      vaultDesc: 'धोरण सिम्युलेशन, भूसंपादन प्रकरणे आणि संस्थात्मक संशोधन प्रकल्पांवर सहयोग करा.',
    },
    landRecordsPage: {
      pageTitle: 'माझे जमीन महसूल व मालकी हक्क दस्तऐवज',
      pageSubtitle: 'प्रमाणित अधिकार अभिलेख (सातबारा / ८-अ), भूकर पार्सल आणि वैधानिक मालकी दस्तऐवज',
      breadcrumbHome: 'मुख्य पान',
      breadcrumbCurrent: 'माझे जमीन अभिलेख',
      addRecordBtn: 'नवीन भूखंड जोडा',
      spatialSearchBtn: 'स्थानिक सीमांकन फिल्टर',
      resetFiltersBtn: 'फिल्टर रीसेट करा',
      searchPlaceholder: 'गट/सर्व्हे नंबर, यूएलपीआयएन, गावाचे नाव...',
      allStates: 'सर्व राज्ये',
      filterDistrict: 'जिल्ह्यानुसार फिल्टर...',
      allLandUse: 'सर्व जमीन वापर',
      allStatuses: 'सर्व स्थिती',
      cardView: 'कार्ड दृश्य',
      tableView: 'नोंदणी तक्ता',
      metricTotalParcels: 'एकूण सत्यापित भूखंड',
      metricTotalArea: 'एकूण क्षेत्रफळ',
      metricActiveTitles: 'सक्रिय मालकी दस्तऐवज',
      metricStatesCovered: 'समाविष्ट राज्ये',
      colParcel: 'पार्सल नंबर / यूएलपीआयएन',
      colLocation: 'गाव आणि जिल्हा',
      colArea: 'क्षेत्रफळ (हेक्टर)',
      colLandUse: 'जमीन वर्गीकरण',
      colStatus: 'वैधानिक स्थिती',
      colActions: 'कृती',
      actionViewDetails: 'सातबारा पहा',
      actionGisMap: 'जीआयएस नकाशा',
      actionAskAi: 'एआय विचारा',
      actionEdit: 'संपादित करा',
      actionDelete: 'हटवा',
      emptyTitle: 'कोणतेही जमीन अभिलेख सापडले नाहीत',
      emptyDesc: 'दिलेल्या फिल्टरनुसार कोणताही भूखंड सापडला नाही. कृपया शोध पर्याय बदला.',
    },
    explorePage: {
      pageTitle: 'नोंदणी आणि भूकर शोध',
      pageSubtitle: 'जमीन सुधारणा कायदे, राज्य भूकर आणि महसूल निर्णयांसाठी राष्ट्रीय शोध प्रणाली',
      breadcrumbHome: 'मुख्य पान',
      breadcrumbCurrent: 'नोंदणी आणि भूकर शोध',
      searchPlaceholder: 'कायद्याचे नाव, कलम, भाडेकरू नियम किंवा कीवर्डने शोधा...',
      allTypes: 'सर्व दस्तऐवज प्रकार',
      typeStatute: 'अधिनियम / कायदा',
      typeOrder: 'न्यायालयीन आदेश',
      typePolicy: 'धोरण दस्तऐवज',
      typeCircular: 'महसूल परिपत्रक',
      allStates: 'सर्व राज्ये',
      resetFiltersBtn: 'फिल्टर रीसेट करा',
      metricStatutes: 'प्रकाशित कायदे',
      metricStates: 'राज्य भूकर प्रणाली',
      metricPrecedents: 'कायदेशीर निर्णय',
      metricAiIndex: 'एआय ज्ञान निर्देशांक',
      statePortalsHeading: 'राज्य भूकर नोंदणी आणि महसूल पोर्टल',
      statePortalsSub: 'राज्य डिजिटल जमीन अभिलेख प्रणालींमध्ये थेट प्रवेश',
      resultsHeading: 'वैधानिक शोध निकाल आणि दस्तऐवज',
      thematicHeading: 'जमीन प्रशासनाचे मुख्य स्तंभ',
      thematicSub: 'महत्त्वाचे कायदेशीर व धोरणात्मक विषय',
      actionViewDoc: 'दस्तऐवज पहा',
      actionAskAi: 'एआय द्वारे विश्लेषण करा',
      askAiPrompt: 'वैधानिक एआय विचारा',
    },
    gisPage: {
      pageTitle: 'स्थानिक भू-नकाशा आणि भूखंड जीआयएस एक्सप्लोरर',
      pageSubtitle: 'पोस्टजीआयएस स्थानिक भूखंड सीमा, भू-वापर क्षेत्र आणि प्रमाणित मालकी हक्क भूमिती दर्शविणारा उच्च-रिझोल्यूशन परस्परसंवादी नकाशा.',
      breadcrumbHome: 'मुख्य पान',
      breadcrumbCurrent: 'जीआयएस भू-नकाशा',
      filterBtn: 'जीआयएस स्थानिक फिल्टर्स',
      resetViewBtn: 'स्थानिक दृश्य रीसेट करा',
      legendTitle: 'भू-नकाशा सूची',
      metricLoadedParcels: 'दृश्यातील लोड केलेले भूखंड',
      metricSpatialEngine: 'पोस्टजीआयएस स्थानिक इंजिन',
      metricZoomStatus: 'भू-नकाशा रिझोल्यूशन',
      metricSurveyStandard: 'भारतीय सर्वेक्षण विभाग मानक',
      zoomWarning: 'भूखंड सीमा लोड करण्यासाठी लेव्हल १२+ पर्यंत झूम इन करा.',
      truncatedWarning: 'दृश्य मर्यादित: स्थानिक भूखंडांच्या सविस्तर तपासणीसाठी झूम इन करा.',
      fetchingLayer: 'स्थानिक स्तर लोड होत आहे...',
      quickLocations: 'त्वरित भूकर स्थाने:',
      locBhopal: 'भोपाळ (हुजूर तहसील)',
      locIndore: 'इंदूर (राऊ तहसील)',
      locSehore: 'सिहोर (कृषी भू-नकाशा)',
      layerAgricultural: 'शेतीजमीन / कृषी क्षेत्र',
      layerResidential: 'निवासी भूखंड',
      layerCommercial: 'व्यावसायिक क्षेत्र',
      layerIndustrial: 'औद्योगिक क्षेत्र',
      layerForest: 'वन व पर्यावरण संरक्षित',
      layerWaterBody: 'जलसाठा आणि नदी क्षेत्र',
      layerDisputed: 'वादग्रस्त / बोजा असलेले',
      drawerTitle: 'भूखंड भू-अभिलेख तपशील',
      tabSpatialDetails: 'स्थानिक गुणधर्म',
      tabLinkedResearch: 'संबंधित संशोधन व दस्तऐवज',
      tabAiEvidence: 'एआय कायदेशीर पुरावा व संदर्भ',
      btnLinkProject: 'प्रकल्पाशी जोडा',
      btnCopyGeoJson: 'पोस्टजीआयएस जिओजेसन कॉपी करा',
      btnZoomParcel: 'नकाशावर भूखंड केंद्रित करा',
      lblParcelId: 'गट / भूखंड क्रमांक',
      lblOwner: 'नोंदणीकृत खातेदार',
      lblArea: 'भूकर क्षेत्रफळ',
      lblLandUse: 'जमीन वापर वर्गीकरण',
      lblStatus: 'मालकी व फेरफार स्थिती',
      lblCoordinates: 'भूखंड केंद्र निर्देशांक',
    },
    governancePage: {
      pageTitle: 'महसूल प्रशासन रडार आणि वैधानिक मापदंड',
      pageSubtitle: 'रिअल-टाइम जमीन प्रशासन निर्देशांक, फेरफार कालावधी, वाद प्रलंबितता वितरण आणि वैधानिक अनुपालन ऑडिट बेसलाइन.',
      breadcrumbHome: 'मुख्य पान',
      breadcrumbCurrent: 'महसूल प्रशासन रडार',
      temporalCompareBtn: 'कालिक राज्य तुलना',
      refreshBtn: 'मेट्रिक्स रिफ्रेश करा',
      badgeLive: 'थेट पोस्टजीआयएस गणना',
      badgeFramework: 'एनआयसी प्रशासन आराखडा',
      metricDigitizationTitle: 'जमीन अभिलेख डिजिटलायझेशन',
      metricDigitizationSub: 'देशभरातील संगणकीकृत सातबारा',
      metricMutationTitle: 'सरासरी फेरफार वेग',
      metricMutationSub: 'वैधानिक निपटारा सरासरी वेळ',
      metricPostGisSyncTitle: 'स्थानिक भू-नकाशा सिंक',
      metricPostGisSyncSub: 'एकात्मिक राज्ये आणि केंद्रशासित प्रदेश',
      metricAuditTrailTitle: 'वैधानिक ऑडिट ट्रेल',
      metricAuditTrailSub: 'अपरिवर्तनीय बेसलाइन स्नॅपशॉट',
      scopeNational: 'राष्ट्रीय विहंगावलोकन',
      scopeState: 'राज्य प्रशासन',
      scopeDistrict: 'जिल्हाधिकारी कार्यालय',
      scopeTehsil: 'तहसील महसूल न्यायालय',
      scopeVillage: 'ग्राम भूकर',
      tabExecutiveSummary: 'कार्यकारी प्रशासन रडार',
      tabDetailedMetrics: 'सविस्तर निर्देशांक तक्ता',
      tabAuditSnapshots: 'ऑडिट स्नॅपशॉट संग्रहण',
      btnCaptureSnapshot: 'ऑडिट स्नॅपशॉट नोंदवा',
      lblActiveBaseline: 'सक्रिय भूकर एकत्रीकरण',
    },
    assistantPage: {
      pageTitle: 'पुरावा-आधारित वैधानिक एआय सहाय्यक',
      pageSubtitle: 'सत्यापित वैधानिक परिपत्रके, धोरण नियमावली आणि भूकर संशोधन दस्तऐवजांवर आधारित संवादात्मक कायदेशीर विश्लेषण.',
      breadcrumbHome: 'मुख्य पान',
      breadcrumbCurrent: 'वैधानिक एआय सहाय्यक',
      badgeAiSynthesis: 'वैधानिक एआय संश्लेषण',
      advisoryNotice: 'वैधानिक संशोधन सूचना',
      advisoryDisclaimer: 'भूमी-दृष्टी केवळ ज्ञान भांडारातील अधिकृत दस्तऐवजांच्या आधारे पुरावा-समर्थित माहिती प्रदान करते. हा अधिकृत कायदेशीर सल्ला किंवा महसूल न्यायालयाच्या निकालाचा पर्याय नाही.',
      activeContextLabel: 'सक्रिय वैधानिक संदर्भ:',
      activeContextDesc: 'माहिती पुनर्प्राप्ती आणि कायदेशीर विश्लेषण केवळ याच निवडक संसाधनावर आधारित राहील.',
      btnClearContext: 'संदर्भ पुसा',
      queryInputPlaceholder: 'वैधानिक नियम, भूकर मानके किंवा जमीन प्रशासन तरतुदींविषयी प्रश्न विचारा...',
      btnAskAssistant: 'सहाय्यकाला विचारा',
      btnSynthesizing: 'विश्लेषण सुरू आहे...',
      btnScopeFilter: 'व्याप्ती फिल्टर',
      filterTargetDocType: 'लक्षित दस्तऐवज प्रकार:',
      optAllDocTypes: 'सर्व दस्तऐवज प्रकार',
      optResearchPaper: 'संशोधन निबंध',
      optPolicyDocument: 'धोरण दस्तऐवज',
      optGovReport: 'शासकीय अहवाल',
      optAcademicPub: 'शैक्षणिक प्रकाशन',
      optLegalDoc: 'कायदेशीर दस्तऐवज',
      metricStatutesIndexedTitle: '1,420+ कायदे व परिपत्रके',
      metricStatutesIndexedSub: 'जमीन महसूल संहिता आणि वन हक्क',
      metricGroundingThresholdTitle: 'कठोर पुरावा पडताळणी',
      metricGroundingThresholdSub: 'शून्य काल्पनिक त्रुटी',
      metricAvgLatencyTitle: 'सरासरी प्रतिसाद गती',
      metricAvgLatencySub: '~1.2 सेकंद सिमेंटिक शोध',
      metricZeroHallucinationTitle: 'वैधानिक प्रामाणिकता',
      metricZeroHallucinationSub: '100% पडताळणीयोग्य स्रोत',
      emptyTitle: 'पुरावा-आधारित वैधानिक व धोरणात्मक बुद्धिमत्ता',
      emptySubtitle: 'विशिष्ट कायदेशीर किंवा जमीन प्रशासन प्रश्न विचारा. प्रत्येक उत्तर अधिकृत परिपत्रके आणि सर्वेक्षण नियमावलीवर आधारित आहे.',
      featureStrictGroundingTitle: 'कठोर पुरावा आधार',
      featureStrictGroundingSub: 'सहाय्यक केवळ पडताळणी केलेल्या नोंदींवरून उत्तरे तयार करतो. अपुरा पुरावा असल्यास स्वयंचलित सुरक्षा गेटिंग लागू होते.',
      featureInteractiveProvenanceTitle: 'इंटरॅक्टिव्ह स्रोत संदर्भ',
      featureInteractiveProvenanceSub: 'प्रत्येक संदर्भ डेटाबेसमधील अचूक पृष्ठ, कलम शीर्षक आणि प्रकाशन तपशीलाशी जोडलेला आहे.',
      featureZeroHallucinationTitle: 'काल्पनिक संदर्भांचा अभाव',
      featureZeroHallucinationSub: 'अपुष्ट किंवा खोटे संदर्भ उत्तर प्रदर्शित होण्यापूर्वी सर्व्हर पातळीवर वगळले जातात.',
      suggestedQueriesTitle: 'सुचवलेले कायदेशीर प्रश्न',
      catLandTransfer: 'जमीन हस्तांतरण नियम',
      queryLandTransfer: 'शेतीजमीन हस्तांतरणाबाबत कोणत्या वैधानिक तरतुदी लागू आहेत?',
      catCadastralStandards: 'भूकर अचूकता मानके',
      queryCadastralStandards: 'ड्रोन सर्वेक्षणासाठी भूकर सीमा अचूकतेची मानके काय आहेत?',
      catRecordOfRights: 'हक्क नोंद (सातबारा)',
      queryRecordOfRights: 'सातबारा डिजिटलायझेशन आवश्यकता कोणत्या दस्तऐवजांमध्ये आहेत?',
      catForestTribalRights: 'वन आणि आदिवासी हक्क',
      queryForestTribalRights: 'आदिवासी जमीन धारणा आणि वन हक्कांशी संबंधित कायदेशीर चौकट काय आहे?',
      assistantResponseHeading: 'वैधानिक सहाय्यक प्रतिसाद',
      auditDiagnostics: 'ऑडिट व पुनर्प्राप्ती विश्लेषण',
      verifiedCitationsCount: 'सत्यापित संदर्भ',
      queryEchoPrefix: 'प्रश्न:',
    },
    workspacesPage: {
      pageTitle: 'संशोधन कार्यक्षेत्र आणि सार्वभौम वॉल्ट',
      pageSubtitle: 'जमीन प्रशासन संशोधन, जीआयएस भूकर पार्सल बुद्धिमत्ता, धोरण मॉडेलिंग आणि सामायिक सत्यापित डेटासेटसाठी संस्थात्मक व्यासपीठ.',
      breadcrumbHome: 'मुख्य पान',
      breadcrumbCurrent: 'कार्यक्षेत्र आणि वॉल्ट',
      badgeCollaborative: 'सहयोगात्मक वातावरण',
      badgeVault: 'सार्वभौम संशोधन वॉल्ट',
      btnNewWorkspace: 'नवीन कार्यक्षेत्र',
      tabAll: 'सर्व संस्थात्मक कार्यक्षेत्रे',
      tabMy: 'माझी सक्रिय कार्यक्षेत्रे',
      metricTotalWorkspacesTitle: 'संस्थात्मक कार्यक्षेत्रे',
      metricTotalWorkspacesSub: 'महसूल, सर्वेक्षण आणि शैक्षणिक',
      metricActiveProjectsTitle: 'सहयोगी प्रकल्प',
      metricActiveProjectsSub: 'भूकर आणि जमीन अभिलेख',
      metricLinkedParcelsTitle: 'जोडलेले भूकर पार्सल',
      metricLinkedParcelsSub: 'पोस्टजीआयएस स्थानिक संलग्नता',
      metricAuditReadyTitle: 'आरबीएसी सुरक्षित वॉल्ट',
      metricAuditReadySub: 'वैधानिक अपरिवर्तनीय ऑडिट',
      emptyTitle: 'कोणतेही कार्यक्षेत्र आढळले नाही',
      emptySubAll: 'सध्या कोणतीही सार्वजनिक कार्यक्षेत्रे उपलब्ध नाहीत.',
      emptySubMy: 'तुम्ही अद्याप कोणत्याही कार्यक्षेत्रात सामील झालेले नाही किंवा नवीन कार्यक्षेत्र तयार केलेले नाही.',
      btnCreateFirst: 'तुमचे पहिले कार्यक्षेत्र तयार करा',
      cardPublic: 'सार्वजनिक',
      cardPrivate: 'खाजगी',
      cardMember: 'सदस्य',
      cardMembers: 'सदस्य',
      cardProject: 'प्रकल्प',
      cardProjects: 'प्रकल्प',
      cardOpen: 'कार्यक्षेत्र उघडा',
      cardNoDesc: 'कोणतेही वर्णन दिलेले नाही.',
      modalTitle: 'संशोधन कार्यक्षेत्र तयार करा',
      modalSub: 'संशोधन प्रकल्प, डेटासेट आणि जीआयएस पार्सल विश्लेषणासाठी संस्थात्मक केंद्र सुरू करा.',
      lblWorkspaceName: 'कार्यक्षेत्राचे नाव *',
      phWorkspaceName: 'उदा. महाराष्ट्र जमीन प्रशासन संशोधन केंद्र',
      lblInstitution: 'संस्था / संघटना',
      phInstitution: 'उदा. भूमी अभिलेख विभाग / आयआयटी मुंबई',
      lblVisibility: 'प्रवेश दृश्यता',
      optPrivate: 'खाजगी (फक्त सदस्य आणि अधिकारी)',
      optPublic: 'सार्वजनिक (सर्वांसाठी उपलब्ध)',
      lblDescription: 'वर्णन',
      phDescription: 'ध्येये, संशोधन क्षेत्र आणि सहभागी संघ...',
      btnCancel: 'रद्द करा',
      btnCreate: 'कार्यक्षेत्र तयार करा',
      btnCreating: 'तयार करत आहे...',
    },
    profilePage: {
      pageTitle: 'नागरिक प्रोफाइल आणि संस्थात्मक ओळख',
      pageSubtitle: 'भूमी-दृष्टीवर आपले सत्यापित ओळखपत्र, नेमून दिलेले महसूल कार्यक्षेत्र आणि सार्वभौम अधिकार मर्यादा तपासा.',
      breadcrumbHome: 'मुख्य पृष्ठ',
      breadcrumbCurrent: 'नागरिक प्रोफाइल',
      badgeVerifiedSession: 'सत्यापित अधिकृत सत्र',
      badgeInstitutional: 'राष्ट्रीय भूमी अभिलेख पोर्टल',
      btnSignOut: 'लॉग आउट करा',
      btnSigningOut: 'लॉग आउट होत आहे...',
      metricAccountStatusTitle: 'सक्रिय आणि सत्यापित',
      metricAccountStatusSub: 'नागरिक / संस्थात्मक ओळख',
      metricPlatformRoleTitle: 'नेमून दिलेली भूमिका',
      metricPlatformRoleSub: 'वैधानिक प्रशासन परवानगी',
      metricJurisdictionTitle: 'मध्य प्रदेश',
      metricJurisdictionSub: 'राज्य भूमी अभिलेख आणि महसूल पोर्टल',
      metricSecurityTitle: 'ऑडिट-नोंदणीकृत TLS',
      metricSecuritySub: 'HttpOnly JWT टोकन सुरक्षा',
      secCredentialsTitle: 'वैयक्तिक प्रमाणपत्रे आणि प्रमाणीकरण मर्यादा',
      secCredentialsSub: 'अधिकृत ओळख नोंदी आणि क्रिप्टोग्राफिक सत्र तपशील.',
      lblFullName: 'पूर्ण नाव',
      lblEmail: 'ईमेल पत्ता',
      lblPlatformRole: 'प्लॅटफॉर्म भूमिका',
      lblSignedInVia: 'प्रमाणीकरण पद्धत',
      lblAccountId: 'नागरिक सत्र UID',
      valGoogleSso: 'संस्थात्मक गुगल एसएसओ (Google SSO)',
      valEmailPassword: 'ईमेल आणि सुरक्षित पासवर्ड',
      noticeSecurity: 'आपले सत्र 256-बिट टीएलएस एन्क्रिप्शनसह HttpOnly कुकीजमध्ये सुरक्षितपणे साठवले आहे. क्लायंट-साइड स्क्रिप्ट्स या टोकनपर्यंत पोहोचू शकत नाहीत.',
      secJurisdictionsTitle: 'नेमून दिलेली भूकर आणि महसूल कार्यक्षेत्रे',
      secJurisdictionsSub: 'भूमी अभिलेख प्रवेश आणि तपासणीसाठी निर्धारित वैधानिक प्रशासकीय सीमा.',
      lblStateRevenue: 'राज्य महसूल विभाग',
      valStateRevenue: 'मध्य प्रदेश शासन — महसूल आणि भूमी अभिलेख संचालनालय',
      lblDistricts: 'सक्रिय जिल्हाधिकारी जिल्हे',
      valDistricts: 'भोपाळ (विभाग), इंदूर, सिहोर',
      lblTehsils: 'अधिकृत महसूल तालुके',
      valTehsils: 'हुजूर, राऊ, सिहोर ग्रामीण (खसरा आणि भूकर नकाशे)',
      lblAccessScope: 'भूकर अभिलेख प्रवेश अधिकार',
      valAccessScope: 'सार्वजनिक जमीन नोंदणी शोध, जीआयएस भूकर नकाशा, डिजिटल ७/१२ व खसरा डाउनलोड, वैधानिक एआय सहाय्य',
      roleAdmin: 'प्रणाली प्रशासक',
      roleGovOfficial: 'शासकीय महसूल अधिकारी',
      roleResearcher: 'भूकर संशोधक',
      roleAcademia: 'शैक्षणिक / कायदेतज्ज्ञ',
      rolePublic: 'नोंदणीकृत नागरिक / खातेदार',
    },
    homePage: {
      heroBadge1: 'राष्ट्रीय स्थानिक भूकर',
      heroHeadline1: 'भारतातील प्रत्येक जमीन पार्सल,',
      heroAccent1: 'डिजिटल पद्धतीने मॅप आणि सत्यापित',
      heroSub1: 'PostGIS WGS-84 भूकर सीमा, खसरा वर्गीकरण आणि सुरक्षित ऑडिट हमीसह नोंदणीकृत मालकी हक्क दस्तऐवज मिळवा.',
      heroPill1a: 'PostGIS भूकर',
      heroPill1b: 'स्थानिक बहुभुज',
      heroPill1c: 'त्वरित पडताळणी',
      heroBadge2: 'राज्य महसूल गुप्तवार्ता',
      heroHeadline2: 'राज्य महसूल प्रशासन',
      heroAccent2: 'रिअल-टाइम प्रमाणात',
      heroSub2: 'जिल्हास्तरीय केपीआय, जमीन महसूल संकलन निकष, फेरफार वेग आणि अनुपालन ऑडिट स्नॅपशॉट तपासा.',
      heroPill2a: '५२ जिल्हे',
      heroPill2b: 'फेरफार वेग',
      heroPill2c: 'ऑडिट ट्रेल',
      heroBadge3: 'पुरावा-आधारित एआय',
      heroHeadline3: 'वैधानिक जमीन कायदा प्रश्नोत्तरे,',
      heroAccent3: 'अधिकृत कायद्यांवर आधारित',
      heroSub3: 'RFCTLARR 2013, राज्य कुळवहिवाट नियम आणि महसूल संहितेवर शब्दशः संदर्भ जुळणीसह प्रश्न विचारा.',
      heroPill3a: 'वैधानिक संदर्भ',
      heroPill3b: 'शून्य भ्रम',
      heroPill3c: 'न्यायालयीन दाखले',
      heroBadge4: 'एकीकृत कायदेशीर संकलन',
      heroHeadline4: 'अधिकृत जमीन कायदे',
      heroAccent4: 'आणि धोरणात्मक चौकट',
      heroSub4: '१,२४०+ डिजिटायझेशन केलेले केंद्रीय व राज्य कायदे, उच्च न्यायालयाचे निकाल आणि भूकर पुनर्सर्वेक्षण अधिसूचना पहा.',
      heroPill4a: '१,२४०+ कायदे',
      heroPill4b: 'सिमँटिक शोध',
      heroPill4c: 'मॉडेल धोरणे',
      heroBtnExplore: 'व्यासपीठ एक्सप्लोर करा',
      heroBtnLogin: 'लॉग इन / नोंदणी',
      heroBtnDashboard: 'डॅशबोर्डवर जा',
      statParcelsVal: '४,२८०+',
      statParcelsLbl: 'भूकर पार्सल',
      statParcelsSub: 'WGS-84 PostGIS स्थानिक बहुभुज',
      statDistrictsVal: '५२',
      statDistrictsLbl: 'महसूल जिल्हे',
      statDistrictsSub: 'राज्य प्रशासन निर्देशांकाद्वारे संनियंत्रित',
      statInstrumentsVal: '१,२४०+',
      statInstrumentsLbl: 'वैधानिक दस्तऐवज',
      statInstrumentsSub: 'कायदे, महसूल परिपत्रके आणि आदेश',
      statPrecisionVal: '९९.४%',
      statPrecisionLbl: 'पुरावा अचूकता',
      statPrecisionSub: 'शून्य-भ्रम माहिती पुनर्प्राप्ती',
      newBadge: 'सार्वजनिक जमीन अभिलेख आणि दस्तऐवज',
      newTitle: 'भूमी-दृष्टीमध्ये नवीन',
      newSub: 'सार्वजनिक शोधासाठी नुकतेच डिजिटायझेशन केलेले जमीन अभिलेख, वैधानिक परिपत्रके आणि प्रशासन निर्देशांक उपलब्ध आहेत.',
      newViewAll: 'सर्व नोंदी पहा',
      newDeedTitle: 'नोंदणीकृत दस्तऐवज आणि फेरफार स्थिती',
      newDeedDesc: 'नोंदणीकृत खरेदीखत, फेरफार सूचना आणि खसरा सर्वेक्षण पडताळणी क्रमांकांचा त्वरित इलेक्ट्रॉनिक शोध.',
      newActTitle: 'RFCTLARR जमीन संपादन कायदा, २०१३',
      newActDesc: 'ग्रामीण भरपाई गुणक, १००% सांत्वन भत्ता आणि पुनर्वसन हक्कांचे थेट वैधानिक नियम.',
      newLeasingTitle: 'मॉडेल शेतजमीन भाडेपट्टा नियम',
      newLeasingDesc: 'जमीन मालकांचे संरक्षण करत कुळांना संस्थात्मक कर्ज व पीक भरपाई मिळवून देणारी चौकट.',
      newDilrmpTitle: 'DILRMP भूकर आधुनिकीकरण',
      newDilrmpDesc: 'संगणकीकृत जमीन अभिलेख, ड्रोन-आधारित पुनर्सर्वेक्षण आणि स्थानिक भूकर नोंदणीसाठी मानक कार्यप्रणाली.',
      newVelocityTitle: 'जिल्हा फेरफार वेग आणि प्रलंबित प्रकरणे',
      newVelocityDesc: '५२ जिल्ह्यांमधील प्रशासकीय निकाल दर, प्रलंबित फेरफार अर्ज आणि अनुपालन गुणांची पाहणी करा.',
      newAiTitle: 'पुरावा-आधारित एआय कायदेशीर शोध',
      newAiDesc: 'खात्रीशीर मूळ संदर्भांसह राज्य जमीन महसूल कायद्यांवर प्रश्न विचारा.',
      ctaTitle: 'पुराव्यासह जमीन प्रशासनाचा शोध घेण्यास तयार आहात?',
      ctaSub: 'आमच्या पुरावा-आधारित सार्वजनिक पोर्टलद्वारे स्थानिक पार्सल बहुभुज, राज्य महसूल निर्देशक किंवा कायदे तपासा.',
      ctaBtnExplore: 'सार्वजनिक डेटासेट पहा',
      ctaBtnLogin: 'लॉग इन / नोंदणी',
      ctaBtnGovernance: 'महसूल प्रशासन पहा',
      ctaBtnGis: 'जीआयएस नकाशा उघडा',
    },
  },
  te: {
    header: {
      sovereignTagline: 'భూ పరిపాలన కోసం సార్వభౌమ డిజిటల్ వేదిక',
      govBadge: 'GOV.IN',
      fontSmall: 'ఫాంట్ పరిమాణం తగ్గించండి',
      fontNormal: 'సాధారణ ఫాంట్ పరిమాణం',
      fontLarge: 'ఫాంట్ పరిమాణం పెంచండి',
      selectLanguage: 'భాషను ఎంచుకోండి',
      profile: 'పౌర ప్రొఫైల్ వివరాలు',
      myLandRecords: 'నా భూమి రिकార్డులు',
      workspaces: 'వర్క్‌స్పేస్‌లు & వాల్ట్',
      logout: 'లాగ్ అవుట్',
      explorePlatform: 'ప్లాట్‌ఫారమ్ అన్వేషణ',
      loginRegister: 'లాగిన్ / రిజిస్టర్',
      dashboard: 'డాష్‌బోర్డ్',
      savedResearch: 'భద్రపరచిన పరిశోధన',
    },
    sidebar: {
      home: 'హోమ్',
      myLandRecords: 'నా భూమి రికార్డులు',
      registrySearch: 'రిజిస్ట్రీ & కాడాస్ట్రే శోధన',
      workspacesVault: 'వర్క్‌స్పేస్‌లు & వాల్ట్',
      landGovServices: 'భూ పరిపాలన సేవలు',
      gisCadastreMap: 'జిఐఎస్ కాడాస్ట్రే మ్యాప్',
      revenueGovernance: 'రెవెన్యూ పరిపాలన రాడార్',
      statutoryAi: 'చట్టబద్ధమైన AI అసిస్టెంట్',
      aboutBhoomi: 'భూమి-దృష్టి గురించి',
      bhuvanPortal: 'భువన్ ఇస్రో జియో-పోర్టల్',
      portalBadge: 'ISRO',
    },
    welcome: {
      greeting: 'స్వాగతం',
      subtitle: 'మీ ధృవీకరించబడిన భూమి రికార్డులు, చట్టబద్ధమైన పత్రాలు మరియు సార్వభౌమ ప్రాదేశిక రిజిస్ట్రీని యాక్సెస్ చేయండి.',
      verifiedCitizen: 'ధృవీకరించబడిన పౌర ఖాతా',
    },
    slider: {
      heading: 'కీలక భూమి రికార్డులు & హక్కు పత్రాలు',
      subheading: 'భారతీయ రాష్ట్రాల్లో ధృవీకరించబడిన రెవెన్యూ పత్రాలను శోధించండి, పొందండి మరియు ధృవీకరించండి',
      pullDocument: 'పత్రాన్ని పొందండి',
      rorTag: 'అధికారిక హక్కుల రికార్డు',
      rorTitle: 'ఖస్రా - ఖతౌని / పహానీ (RoR)',
      rorSub: 'హక్కుల రికార్డు & కౌలుదారు వివరాలు',
      rorDept: 'రెవెన్యూ & ల్యాండ్ రికార్డ్స్ విభాగం',
      mutationTag: 'మ్యుటేషన్ ఉత్తర్వు',
      mutationTitle: 'మ్యుటేషన్ డిక్రీ & ఉత్తర్వు పత్రం',
      mutationSub: 'చట్టబద్ధమైన యాజమాన్య బదిలీ',
      mutationDept: 'తహశీల్దార్ రెవెన్యూ కోర్టు',
      saleDeedTag: 'ధృవీకరించబడిన సేల్ డీడ్',
      saleDeedTitle: 'రిజిస్టర్డ్ సేల్ & టైటిల్ డీడ్',
      saleDeedSub: 'ధృవీకరించబడిన బదిలీ పత్రం',
      saleDeedDept: 'ఇన్‌స్పెక్టర్ జనరల్ ఆఫ్ రిజిస్ట్రేషన్',
      mapTag: 'జిఐఎస్ పార్శిల్ సర్వే',
      mapTitle: 'ప్రాదేశిక కాడాస్ట్రల్ మ్యాప్ (భూ-నక్షా)',
      mapSub: 'డిజిటల్ భూ సరిహద్దుల మ్యాప్',
      mapDept: 'సర్వే ఆఫ్ ఇండియా / DILRMP కాడాస్ట్రే',
    },
    stateServices: {
      heading: 'కొత్తగా అనుసంధానించబడిన రాష్ట్ర సేవలు',
      subheading: 'రాష్ట్ర డిజిటల్ భూ రికార్డుల అధికారులతో ప్రత్యక్ష సమన్వయం',
      viewAll: 'అన్ని సేవలను చూడండి',
      availableNow: 'ఇప్పుడు అందుబాటులో ఉంది',
      mpTitle: 'రిజిస్టర్డ్ కన్వేయన్స్ డీడ్',
      mpSub: 'రిజిస్టర్డ్ సేల్ డీడ్ (మధ్యప్రదేశ్)',
      mpDept: 'రిజిస్ట్రేషన్ & స్టాంపుల విభాగం, MP',
      upTitle: 'ఖస్రా - ఖతౌని (B-1)',
      upSub: 'ఖస్రా - ఖతౌని భూ రికార్డులు (UP)',
      upDept: 'బోర్డ్ ఆఫ్ రెవెన్యూ, UP (భూలేఖ్)',
      mhTitle: 'మ్యుటేషన్ క్లియరెన్స్ ఆర్డర్',
      mhSub: 'ఫేర్‌ఫార్ / 7/12 ఉతారా (మహారాష్ట్ర)',
      mhDept: 'డైరెక్టరేట్ ఆఫ్ ల్యాండ్ రికార్డ్స్, మహారాష్ట్ర',
      gjTitle: 'జియో-రిఫరెన్స్డ్ భూ-నక్షా',
      gjSub: 'డిజిటల్ గ్రామ మ్యాప్ & సరిహద్దులు',
      gjDept: 'సూపరింటెండెంట్ ఆఫ్ ల్యాండ్ రికార్డ్స్, గుజరాత్',
    },
    issuedRecords: {
      heading: 'నా జారీ చేయబడిన భూమి పత్రాలు & ధృవీకరించబడిన ప్లాట్లు',
      subheading: 'మీ రెవెన్యూ ఖాతాకు అనుసంధానించబడిన క్రియాశీల హక్కు పత్రాలు మరియు పార్శిల్స్',
      viewAll: 'అన్నీ చూడండి',
      activeStatus: 'యాక్టివ్',
      gisMap: 'జిఐఎస్ మ్యాప్',
      askAi: 'AI ని అడగండి',
      areaHectares: 'హెక్టార్లు',
      noRecordsTitle: 'జారీ చేయబడిన భూమి పత్రాలు ఏవీ కనుగొనబడలేదు',
      noRecordsDesc: 'మీరు ఇంకా మీ పౌర ఖాతాకు ఏ భూమి ప్లాట్లను అనుసంధానించలేదు.',
      exploreRegistry: 'రిజిస్ట్రీని అన్వేషించండి',
    },
    quickTools: {
      heading: 'ప్లాట్‌ఫామ్ సామర్థ్యాలు & శీఘ్ర సాధనాలు',
      subheading: 'కోర్ ప్రాదేశిక, పరిపాలనా మరియు AI ఇంటెలిజెన్స్ ఇంజిన్‌లకు ప్రత్యక్ష ప్రాప్యత',
      launchEngine: 'ప్రారంభించండి',
      gisTitle: 'జిఐఎస్ కాడాస్ట్రల్ ఎక్స్‌ప్లోరర్',
      gisTag: 'ప్రాదేశిక రిజిస్ట్రీ',
      gisDesc: 'జియో-రిఫరెన్స్డ్ సరిహద్దులు, ఉపగ్రహ బేస్ లేయర్‌లు మరియు రియల్-టైమ్ ల్యాండ్ పార్శిల్ ఓవర్‌లేలను అన్వేషించండి.',
      govTitle: 'రెవెన్యూ గవర్నెన్స్ రాడార్',
      govTag: 'లైవ్ KPI రాడార్',
      govDesc: 'జిల్లా స్థాయి మ్యుటేషన్ వేగం, రెవెన్యూ వివాదాల బ్యాక్‌లాగ్ మరియు పారదర్శకత సూచికలను ట్రాక్ చేయండి.',
      aiTitle: 'చట్టబద్ధమైన AI అసిస్టెంట్',
      aiTag: 'చట్టపరమైన ఇంటెలిజెన్స్',
      aiDesc: 'భూ సంస్కరణల చట్టాలు, RFCTLARR 2013, RERA మరియు మోడల్ అద్దె చట్టం నిబంధనలను పరిశీలించండి.',
      vaultTitle: 'వర్క్‌స్పేస్‌లు & పాలసీ వాల్ట్',
      vaultTag: 'టీమ్ వర్క్‌స్పేస్‌లు',
      vaultDesc: 'పాలసీ అనుకరణలు, భూసేకరణ కేసులు మరియు సంస్థాగత పరిశోధన ప్రాజెక్ట్‌లలో సహకరించండి.',
    },
    landRecordsPage: {
      pageTitle: 'నా భూమి రికార్డులు & హక్కు పత్రాలు',
      pageSubtitle: 'ధృవీకరించబడిన హక్కుల రికార్డు (RoR), కాడాస్ట్రల్ పార్శిల్స్ మరియు చట్టబద్ధమైన పత్రాలు',
      breadcrumbHome: 'హోమ్',
      breadcrumbCurrent: 'నా భూమి రికార్డులు',
      addRecordBtn: 'కొత్త పార్శిల్ జోడించండి',
      spatialSearchBtn: 'ప్రాదేశిక సరిహద్దు ఫిల్టర్',
      resetFiltersBtn: 'ఫిల్టర్లను రీసెట్ చేయండి',
      searchPlaceholder: 'పార్శిల్ నంబర్, ULPIN, గ్రామం పేరుతో శోధించండి...',
      allStates: 'అన్ని భారతీయ రాష్ట్రాలు',
      filterDistrict: 'జిల్లా ప్రకారం ఫిల్టర్...',
      allLandUse: 'అన్ని భూ వినియోగాలు',
      allStatuses: 'అన్ని స్థితులు',
      cardView: 'కార్డుల వీక్షణ',
      tableView: 'రిజిస్ట్రీ పట్టిక',
      metricTotalParcels: 'మొత్తం ధృవీకరించబడిన పార్శిల్స్',
      metricTotalArea: 'మొత్తం విస్తీర్ణం',
      metricActiveTitles: 'క్రియాశీల హక్కు పత్రాలు',
      metricStatesCovered: 'అనుసంధాన రాష్ట్రాలు',
      colParcel: 'పార్శిల్ నంబర్ / ULPIN',
      colLocation: 'గ్రామం & జిల్లా',
      colArea: 'విస్తీర్ణం (హెక్టార్లు)',
      colLandUse: 'భూ వర్గీకరణ',
      colStatus: 'చట్టబద్ధమైన స్థితి',
      colActions: 'చర్యలు',
      actionViewDetails: 'వివరాలు చూడండి',
      actionGisMap: 'జిఐఎస్ మ్యాప్',
      actionAskAi: 'AI ని అడగండి',
      actionEdit: 'సవరించు',
      actionDelete: 'తొలగించు',
      emptyTitle: 'భూమి రికార్డులు ఏవీ కనుగొనబడలేదు',
      emptyDesc: 'మీ ఫిల్టర్లకు సరిపోలే రికార్డులు ఏవీ లేవు. దయచేసి శోధనను మార్చి ప్రయత్నించండి.',
    },
    explorePage: {
      pageTitle: 'రిజిస్ట్రీ & కాడాస్ట్రే శోధన',
      pageSubtitle: 'భూ సంస్కరణల చట్టాలు, రాష్ట్ర కాడాస్ట్రల్ రికార్డులు మరియు రెవెన్యూ మార్గదర్శకాల శోధన వేదిక',
      breadcrumbHome: 'హోమ్',
      breadcrumbCurrent: 'రిజిస్ట్రీ & కాడాస్ట్రే శోధన',
      searchPlaceholder: 'చట్టం పేరు, సెక్షన్, నిబంధనలు లేదా కీవర్డ్‌తో శోధించండి...',
      allTypes: 'అన్ని పత్రాల రకాలు',
      typeStatute: 'చట్టం / శాసనం',
      typeOrder: 'న్యాయ ఉత్తర్వు',
      typePolicy: 'పాలసీ పత్రం',
      typeCircular: 'రెవెన్యూ సర్క్యులర్',
      allStates: 'అన్ని అధికార పరిధులు',
      resetFiltersBtn: 'ఫిల్టర్లను రీసెట్ చేయండి',
      metricStatutes: 'ప్రచురించిన చట్టాలు',
      metricStates: 'రాష్ట్ర కాడాస్ట్రల్ వ్యవస్థలు',
      metricPrecedents: 'చట్టపరమైన తీర్పులు',
      metricAiIndex: 'AI నాలెడ్జ్ ఇండెక్స్',
      statePortalsHeading: 'రాష్ట్ర కాడాస్ట్రల్ రిజిస్ట్రీలు & రెవెన్యూ పోర్టల్‌లు',
      statePortalsSub: 'రాష్ట్ర డిజిటల్ భూ రికార్డుల వ్యవస్థలకు ప్రత్యక్ష ప్రాప్యత',
      resultsHeading: 'చట్టబద్ధమైన శోధన ఫలితాలు & పత్రాలు',
      thematicHeading: 'భూ పరిపాలన ప్రధాన విభాగాలు',
      thematicSub: 'కీలక పాలసీ ఫ్రేమ్‌వర్క్‌లు మరియు చట్టపరమైన డొమైన్‌లు',
      actionViewDoc: 'పత్రాన్ని చూడండి',
      actionAskAi: 'AI తో విశ్లేషించండి',
      askAiPrompt: 'చట్టబద్ధమైన AI ని అడగండి',
    },
    gisPage: {
      pageTitle: 'స్పేషియల్ కాడాస్ట్రే & జిఐఎస్ భూ పార్సెల్ ఎక్స్‌ప్లోరర్',
      pageSubtitle: 'పోస్ట్‌జిఐఎస్ ప్రాదేశిక పార్సెల్ సరిహద్దులు, భూ వినియోగ జోనింగ్ మరియు సర్టిఫైడ్ యాజమాన్య జ్యామితిని చూపే హై-రిజల్యూషన్ మ్యాప్.',
      breadcrumbHome: 'హోమ్',
      breadcrumbCurrent: 'జిఐఎస్ కాడాస్ట్రే మ్యాప్',
      filterBtn: 'జిఐఎస్ ప్రాదేశిక ఫిల్టర్లు',
      resetViewBtn: 'స్పేషియల్ వీక్షణ రీసెట్ చేయండి',
      legendTitle: 'కాడాస్ట్రల్ లెజెండ్',
      metricLoadedParcels: 'వీక్షణలోని పార్సెళ్ళు',
      metricSpatialEngine: 'పోస్ట్‌జిఐఎస్ ప్రాదేశిక ఇంజిన్',
      metricZoomStatus: 'కాడాస్ట్రే రిజల్యూషన్',
      metricSurveyStandard: 'సర్వే ఆఫ్ ఇండియా ప్రమాణం',
      zoomWarning: 'భూ పార్సెల్ సరిహద్దులను లోడ్ చేయడానికి లెవెల్ 12+ కు జూమ్ చేయండి.',
      truncatedWarning: 'పరిమిత వీక్షణ: స్థానిక పార్సెళ్లను పరిశీలించడానికి జూమ్ చేయండి.',
      fetchingLayer: 'ప్రాదేశిక లేయర్ లోడ్ అవుతోంది...',
      quickLocations: 'త్వరిత కాడాస్ట్రల్ ప్రాంతాలు:',
      locBhopal: 'భోపాల్ (హుజూర్ తహశీల్)',
      locIndore: 'ఇండోర్ (రావ్ తహశీల్)',
      locSehore: 'సెహోర్ (వ్యవసాయ కాడాస్ట్రే)',
      layerAgricultural: 'వ్యవసాయ భూమి',
      layerResidential: 'నివాస ప్లాట్లు',
      layerCommercial: 'వాణిజ్య జోన్',
      layerIndustrial: 'పారిశ్రామిక జోన్',
      layerForest: 'అటవీ & పర్యావరణ జోన్',
      layerWaterBody: 'జల వనరులు & నదులు',
      layerDisputed: 'వివాదాస్పద / తాకట్టు',
      drawerTitle: 'పార్సెల్ కాడాస్ట్రల్ రికార్డు',
      tabSpatialDetails: 'ప్రాదేశిక లక్షణాలు',
      tabLinkedResearch: 'లింక్ చేసిన పరిశోధన & పత్రాలు',
      tabAiEvidence: 'AI చట్టపరమైన ఆధారాలు & తీర్పులు',
      btnLinkProject: 'ప్రాజెక్ట్‌కు లింక్ చేయండి',
      btnCopyGeoJson: 'పోస్ట్‌జిఐఎస్ జియోజేసన్ కాపీ చేయండి',
      btnZoomParcel: 'మ్యాప్‌పై పార్సెల్ కేంద్రీకరించండి',
      lblParcelId: 'సర్వే / పార్సెల్ నంబర్',
      lblOwner: 'నమోదిత పట్టాదారు',
      lblArea: 'కాడాస్ట్రల్ విస్తీర్ణం',
      lblLandUse: 'భూమి వినియోగ వర్గీకరణ',
      lblStatus: 'యాజమాన్యం & మ్యుటేషన్ స్థితి',
      lblCoordinates: 'సెంట్రాయిడ్ కోఆర్డినేట్లు',
    },
    governancePage: {
      pageTitle: 'రెవెన్యూ పరిపాలన రాడార్ & చట్టబద్ధమైన కొలమానాలు',
      pageSubtitle: 'రియల్-టైమ్ భూ పరిపాలన సూచికలు, మ్యుటేషన్ వేగం, వివాదాల పంపిణీ మరియు చట్టబద్ధమైన సమ్మతి ఆడిట్ బేస్‌లైన్‌లు.',
      breadcrumbHome: 'హోమ్',
      breadcrumbCurrent: 'రెవెన్యూ పరిపాలన రాడార్',
      temporalCompareBtn: 'రాష్ట్రాల కాలక్రమ పోలిక',
      refreshBtn: 'మెట్రిక్స్ రిఫ్రెష్ చేయండి',
      badgeLive: 'లైవ్ పోస్ట్‌జిఐఎస్ లెక్కింపు',
      badgeFramework: 'NIC పాలన ఫ్రేమ్‌వర్క్',
      metricDigitizationTitle: 'భూ రికార్డుల డిజిటలైజేషన్',
      metricDigitizationSub: 'దేశవ్యాప్తంగా కంప్యూటరీకరించిన రికార్డులు',
      metricMutationTitle: 'సగటు మ్యుటేషన్ వేగం',
      metricMutationSub: 'చట్టబద్ధమైన పరిష్కార సగటు సమయం',
      metricPostGisSyncTitle: 'ప్రాదేశిక కాడాస్ట్రే సింక్',
      metricPostGisSyncSub: 'సమన్వయ రాష్ట్రాలు & కేం.పా.',
      metricAuditTrailTitle: 'చట్టబద్ధమైన ఆడిట్ ట్రయల్',
      metricAuditTrailSub: 'మార్పులేని బేస్‌లైన్ స్నాప్‌షాట్‌లు',
      scopeNational: 'జాతీయ అవలోకనం',
      scopeState: 'రాష్ట్ర పరిపాలన',
      scopeDistrict: 'జిల్లా కలెక్టరేట్',
      scopeTehsil: 'తహశీల్దార్ రెవెన్యూ కోర్టు',
      scopeVillage: 'గ్రామ కాడాస్ట్రే',
      tabExecutiveSummary: 'కార్యనిర్వాహక పరిపాలన రాడార్',
      tabDetailedMetrics: 'సమగ్ర సూచికల మాతృక',
      tabAuditSnapshots: 'ఆడిట్ స్నాప్‌షాట్ ఆర్కైవ్',
      btnCaptureSnapshot: 'ఆడిట్ స్నాప్‌షాట్ సంగ్రహించండి',
      lblActiveBaseline: 'క్రియాశీల కాడాస్ట్రల్ సమీకరణ',
    },
    assistantPage: {
      pageTitle: 'రుజువు ఆధారిత చట్టబద్ధమైన AI అసిస్టెంట్',
      pageSubtitle: 'ధృవీకరించబడిన చట్టబద్ధమైన సర్క్యులర్లు, విధాన మాన్యువల్స్ మరియు కాడాస్ట్రల్ పరిశోధన పత్రాల ఆధారంగా ఇంటరాక్టివ్ న్యాయ విశ్లేషణ.',
      breadcrumbHome: 'హోమ్',
      breadcrumbCurrent: 'చట్టబద్ధమైన AI అసిస్టెంట్',
      badgeAiSynthesis: 'చట్టబద్ధమైన AI సంశ్లేషణ',
      advisoryNotice: 'చట్టపరమైన పరిశోధన నోటీసు',
      advisoryDisclaimer: 'భూమి-దృష్టి విజ్ఞాన భాండాగారంలోని ప్రామాణిక పత్రాల ఆధారంగా సమాచారాన్ని అందిస్తుంది. ఇది అధికారిక న్యాయ సలహా లేదా రెవెన్యూ కోర్టు తీర్పుకు ప్రత్యామ్నాయం కాదు.',
      activeContextLabel: 'క్రియాశీల చట్టబద్ధమైన సందర్భం:',
      activeContextDesc: 'AI శోధన మరియు విశ్లేషణ ఈ నిర్దిష్ట వనరు ఆధారంగా పరిమితం చేయబడుతుంది.',
      btnClearContext: 'సందర్భాన్ని తొలగించండి',
      queryInputPlaceholder: 'చట్టపరమైన నిబంధనలు, కాడాస్ట్రల్ ప్రమాణాలు లేదా భూ పరిపాలన అంశాలపై ప్రశ్న అడగండి...',
      btnAskAssistant: 'అసిస్టెంట్‌ను అడగండి',
      btnSynthesizing: 'విశ్లేషిస్తోంది...',
      btnScopeFilter: 'పరిధి ఫిల్టర్',
      filterTargetDocType: 'లక్ష్య పత్ర రకం:',
      optAllDocTypes: 'అన్ని పత్ర రకాలు',
      optResearchPaper: 'పరిశోధనా పత్రం',
      optPolicyDocument: 'విధాన పత్రం',
      optGovReport: 'ప్రభుత్వ నివేదిక',
      optAcademicPub: 'విద్యా ప్రచురణ',
      optLegalDoc: 'చట్టపరమైన పత్రం',
      metricStatutesIndexedTitle: '1,420+ చట్టాలు & సర్క్యులర్లు',
      metricStatutesIndexedSub: 'రెవెన్యూ కోడ్ & అటవీ హక్కుల చట్టం',
      metricGroundingThresholdTitle: 'కఠినమైన ప్రామాణికత పరిమితి',
      metricGroundingThresholdSub: 'జీరో ఫాంటమ్ హాలూసినేషన్',
      metricAvgLatencyTitle: 'సగటు ప్రతిస్పందన వేగం',
      metricAvgLatencySub: '~1.2 సెకన్లు సెమాంటిక్ శోధన',
      metricZeroHallucinationTitle: 'చట్టబద్ధమైన ప్రామాణికత',
      metricZeroHallucinationSub: '100% ధృవీకరించదగిన మూల భాగాలు',
      emptyTitle: 'రుజువు ఆధారిత చట్టబద్ధమైన & విధాన మేధస్సు',
      emptySubtitle: 'నిర్దిష్ట చట్టబద్ధమైన లేదా భూ పరిపాలన ప్రశ్నలను అడగండి. ప్రతి విశ్లేషణ ప్రచురించబడిన పరిశోధనా పత్రాలు మరియు సర్వే మాన్యువల్స్ ఆధారంగా రూపొందించబడింది.',
      featureStrictGroundingTitle: 'కఠినమైన ఆధారాల ప్రాతిపదిక',
      featureStrictGroundingSub: 'అసిస్టెంట్ ధృవీకరించబడిన భాగాల ఆధారంగా మాత్రమే సమాధానాలను రూపొందిస్తుంది. బలహీన ఆధారాలు ఉన్నప్పుడు స్వయంచాలక భద్రతా గేటింగ్ వర్తిస్తుంది.',
      featureInteractiveProvenanceTitle: 'ఇంటరాక్టివ్ మూల ఆధారాలు',
      featureInteractiveProvenanceSub: 'ప్రతి అనులేఖనం డేటాబేస్‌లోని ఖచ్చితమైన పేజీ సంఖ్యలు, సెక్షన్ శీర్షికలను సూచిస్తుంది.',
      featureZeroHallucinationTitle: 'తప్పుడు అనులేఖనాలు ఉండవు',
      featureZeroHallucinationSub: 'రుజువు లేని సమాచారాన్ని సర్వర్ స్థాయిలోనే తొలగించి ఖచ్చితమైన సమాచారాన్ని అందిస్తుంది.',
      suggestedQueriesTitle: 'సూచించిన చట్టపరమైన ప్రశ్నలు',
      catLandTransfer: 'భూ బదిలీ నిబంధనలు',
      queryLandTransfer: 'వ్యవసాయ భూ బదిలీలకు సంబంధించిన చట్టబద్ధమైన నిబంధనలు ఏమిటి?',
      catCadastralStandards: 'కాడాస్ట్రల్ ప్రమాణాలు',
      queryCadastralStandards: 'డ్రోన్ సర్వేల కోసం కాడాస్ట్రల్ సరిహద్దు ఖచ్చితత్వ ప్రమాణాలు ఏమిటి?',
      catRecordOfRights: 'హక్కుల రికార్డు (RoR / పహానీ)',
      queryRecordOfRights: 'హక్కుల రికార్డుల డిజిటలైజేషన్ మార్గదర్శకాలు ఏ పత్రాలలో ఉన్నాయి?',
      catForestTribalRights: 'అటవీ & గిరిజన హక్కులు',
      queryForestTribalRights: 'గిరిజన భూమి మరియు అటవీ హక్కులకు సంబంధించిన చట్టపరమైన నిబంధనలు ఏమిటి?',
      assistantResponseHeading: 'చట్టబద్ధమైన అసిస్టెంట్ ప్రతిస్పందన',
      auditDiagnostics: 'ఆడిట్ & శోధన విశ్లేషణ',
      verifiedCitationsCount: 'ధృవీకరించబడిన అనులేఖనాలు',
      queryEchoPrefix: 'ప్రశ్న:',
    },
    workspacesPage: {
      pageTitle: 'పరిశోధనా వర్క్‌స్పేస్‌లు & సార్వభౌమ వాల్ట్',
      pageSubtitle: 'భూ పరిపాలన పరిశోధన, జిఐఎస్ కాడాస్ట్రల్ పార్శిల్ విశ్లేషణ, విధాన మోడలింగ్ మరియు భాగస్వామ్య ధృవీకృత డేటాసెట్‌ల కోసం సంస్థాగత వేదిక.',
      breadcrumbHome: 'హోమ్',
      breadcrumbCurrent: 'వర్క్‌స్పేస్‌లు & వాల్ట్',
      badgeCollaborative: 'సహకార వాతావరణం',
      badgeVault: 'సార్వభౌమ పరిశోధన వాల్ట్',
      btnNewWorkspace: 'కొత్త వర్క్‌స్పేస్',
      tabAll: 'అన్ని సంస్థాగత వర్క్‌స్పేస్‌లు',
      tabMy: 'నా క్రియాశీల వర్క్‌స్పేస్‌లు',
      metricTotalWorkspacesTitle: 'సంస్థాగత వర్క్‌స్పేస్‌లు',
      metricTotalWorkspacesSub: 'రెవెన్యూ, సర్వే & విద్యారంగం',
      metricActiveProjectsTitle: 'సహకార ప్రాజెక్టులు',
      metricActiveProjectsSub: 'కాడాస్ట్రల్ & భూమి రికార్డులు',
      metricLinkedParcelsTitle: 'అనుసంధానించబడిన పార్శిల్‌లు',
      metricLinkedParcelsSub: 'పోస్ట్‌జిఐఎస్ ప్రాదేశిక బైండింగ్‌లు',
      metricAuditReadyTitle: 'పాత్ర-ఆధారిత RBAC వాల్ట్',
      metricAuditReadySub: 'చట్టబద్ధమైన మార్పులేని ఆడిట్',
      emptyTitle: 'వర్క్‌స్పేస్‌లు కనుగొనబడలేదు',
      emptySubAll: 'ప్రస్తుతం పబ్లిక్ వర్క్‌స్పేస్‌లు ఏవీ అందుబాటులో లేవు.',
      emptySubMy: 'మీరు ఇంకా ఏ వర్క్‌స్పేస్‌లోనూ చేరలేదు లేదా సృష్టించలేదు.',
      btnCreateFirst: 'మీ మొదటి వర్క్‌స్పేస్‌ను సృష్టించండి',
      cardPublic: 'పబ్లిక్',
      cardPrivate: 'ప్రైవేట్',
      cardMember: 'సభ్యుడు',
      cardMembers: 'సభ్యులు',
      cardProject: 'ప్రాజెక్ట్',
      cardProjects: 'ప్రాజెక్టులు',
      cardOpen: 'వర్క్‌స్పేస్‌ను తెరవండి',
      cardNoDesc: 'వివరణ ఏదీ అందించబడలేదు.',
      modalTitle: 'పరిశోధనా వర్క్‌స్పేస్‌ను సృష్టించండి',
      modalSub: 'పరిశోధన ప్రాజెక్టులు, డేటాసెట్‌లు మరియు జిఐఎస్ విశ్లేషణ కోసం సంస్థాగత కేంద్రాన్ని ఏర్పాటు చేయండి.',
      lblWorkspaceName: 'వర్క్‌స్పేస్ పేరు *',
      phWorkspaceName: 'ఉదా. ఆంధ్రప్రదేశ్ ల్యాండ్ గవర్నెన్స్ రీసెర్చ్ ల్యాబ్',
      lblInstitution: 'సంస్థ / విభాగం',
      phInstitution: 'ఉదా. భూమి వనరుల శాఖ / ఐఐటి',
      lblVisibility: 'యాక్సెస్ దృశ్యత',
      optPrivate: 'ప్రైవేట్ (సభ్యులు మరియు అధికారులు మాత్రమే)',
      optPublic: 'పబ్లిక్ (అందరికీ అందుబాటులో ఉంటుంది)',
      lblDescription: 'వివరణ',
      phDescription: 'లక్ష్యాలు, పరిశోధనా డొమైన్ మరియు బృందాలు...',
      btnCancel: 'రద్దు చేయండి',
      btnCreate: 'వర్క్‌స్పేస్ సృష్టించండి',
      btnCreating: 'సృష్టిస్తోంది...',
    },
    profilePage: {
      pageTitle: 'పౌర ప్రొఫైల్ & సంస్థాగత గుర్తింపు',
      pageSubtitle: 'భూమి-దృష్టిలో మీ ధృవీకరించబడిన ఆధారాలు, కేటాయించిన రెవెన్యూ అధికార పరిధి మరియు సార్వభౌమ అధికార సరిహద్దును సమీక్షించండి.',
      breadcrumbHome: 'హోమ్',
      breadcrumbCurrent: 'పౌర ప్రొఫైల్',
      badgeVerifiedSession: 'ధృవీకరించబడిన అధికారిక సెషన్',
      badgeInstitutional: 'జాతీయ భూ రికార్డుల పోర్టల్',
      btnSignOut: 'సైన్ అవుట్',
      btnSigningOut: 'సైన్ అవుట్ అవుతోంది...',
      metricAccountStatusTitle: 'యాక్టివ్ & ధృవీకరించబడింది',
      metricAccountStatusSub: 'పౌరుడు / సంస్థాగత గుర్తింపు',
      metricPlatformRoleTitle: 'కేటాయించిన పాత్ర',
      metricPlatformRoleSub: 'చట్టబద్ధమైన పాలన అనుమతి',
      metricJurisdictionTitle: 'మధ్యప్రదేశ్',
      metricJurisdictionSub: 'రాష్ట్ర భూ రికార్డులు & రెవెన్యూ పోర్టల్',
      metricSecurityTitle: 'ఆడిట్-లాగ్డ్ TLS',
      metricSecuritySub: 'HttpOnly JWT టోకెన్ భద్రత',
      secCredentialsTitle: 'వ్యక్తిగత ఆధారాలు & ప్రామాణీకరణ పరిధి',
      secCredentialsSub: 'అధికారిక గుర్తింపు రికార్డులు మరియు క్రిప్టోగ్రాఫిక్ సెషన్ మెటాడేటా.',
      lblFullName: 'పూర్తి పేరు',
      lblEmail: 'ఈమెయిల్ చిరునామా',
      lblPlatformRole: 'ప్లాట్‌ఫారమ్ పాత్ర',
      lblSignedInVia: 'ద్వారా సైన్ ఇన్ అయ్యారు',
      lblAccountId: 'పౌర సెషన్ UID',
      valGoogleSso: 'సంస్థాగత గూగుల్ SSO (Google SSO)',
      valEmailPassword: 'ఈమెయిల్ మరియు సురక్షిత పాస్‌వర్డ్',
      noticeSecurity: 'మీ సెషన్ 256-బిట్ TLS ఎన్‌క్రిప్షన్‌తో HttpOnly కుకీలలో నిల్వ చేయబడిన క్రిప్టోగ్రాఫిక్ టోకెన్ల ద్వారా సురక్షితంగా రక్షించబడింది. క్లయింట్-సైడ్ స్క్రిప్ట్‌లు టోకెన్‌లను యాక్సెస్ చేయలేవు.',
      secJurisdictionsTitle: 'కేటాయించిన కాడస్ట్రల్ & రెవెన్యూ అధికార పరిధులు',
      secJurisdictionsSub: 'భూ రికార్డుల యాక్సెస్ మరియు ఆడిట్ కోసం కాన్ఫిగర్ చేయబడిన చట్టబద్ధమైన పరిపాలనా సరిహద్దులు.',
      lblStateRevenue: 'రాష్ట్ర రెవెన్యూ శాఖ',
      valStateRevenue: 'మధ్యప్రదేశ్ ప్రభుత్వం — రెవెన్యూ మరియు భూ రికార్డుల డైరెక్టరేట్',
      lblDistricts: 'యాక్టివ్ కలెక్టరేట్ జిల్లాలు',
      valDistricts: 'భోపాల్ (డివిజన్), ఇండోర్, సెహోర్',
      lblTehsils: 'అధికారిక రెవెన్యూ తహసీల్స్',
      valTehsils: 'హుజూర్, రావు, సెహోర్ రూరల్ (ఖస్రా & కాడస్ట్రల్ రికార్డులు)',
      lblAccessScope: 'కాడస్ట్రల్ రికార్డుల యాక్సెస్ స్థాయి',
      valAccessScope: 'పబ్లిక్ ల్యాండ్ రిజిస్ట్రీ శోధన, GIS కాడస్ట్రే వీక్షణ, డిజిటల్ ఖస్రా/పట్టా డౌన్‌లోడ్, చట్టబద్ధమైన AI సహాయం',
      roleAdmin: 'సిస్టమ్ అడ్మినిస్ట్రేటర్',
      roleGovOfficial: 'ప్రభుత్వ రెవెన్యూ అధికారి',
      roleResearcher: 'కాడస్ట్రల్ పరిశోధకుడు',
      roleAcademia: 'విద్యావేత్త / న్యాయ నిపుణుడు',
      rolePublic: 'రిజిస్టర్డ్ పౌరుడు / భూ యజమాని',
    },
    homePage: {
      heroBadge1: 'జాతీయ ప్రాదేశిక కాడస్ట్రే',
      heroHeadline1: 'భారతదేశంలోని ప్రతి ల్యాండ్ పార్సెల్,',
      heroAccent1: 'డిజిటల్‌గా మ్యాప్ చేయబడింది & ధృవీకరించబడింది',
      heroSub1: 'PostGIS WGS-84 కాడస్ట్రల్ సరిహద్దులు, ఖస్రా వర్గీకరణలు మరియు సురక్షితమైన ఆడిట్ హామీలతో నమోదిత యాజమాన్య పత్రాలను యాక్సెస్ చేయండి.',
      heroPill1a: 'PostGIS కాడస్ట్రే',
      heroPill1b: 'ప్రాదేశిక బహుభుజాలు',
      heroPill1c: 'తక్షణ ధృవీకరణ',
      heroBadge2: 'రాష్ట్ర రెవెన్యూ ఇంటెలిజెన్స్',
      heroHeadline2: 'రాష్ట్ర రెవెన్యూ పాలన',
      heroAccent2: 'రియల్-టైమ్ స్థాయిలో',
      heroSub2: 'జిల్లా స్థాయి KPIలు, భూ రెవెన్యూ సేకరణ ప్రమాణాలు, మ్యుటేషన్ వేగం మరియు నిబంధనల ఆడిట్ స్నాప్‌షాట్‌లను పర్యవేక్షించండి.',
      heroPill2a: '52 జిల్లాలు',
      heroPill2b: 'మ్యుటేషన్ వేగం',
      heroPill2c: 'ఆడిట్ ట్రయిల్',
      heroBadge3: 'సాక్ష్య ఆధారిత AI',
      heroHeadline3: 'చట్టబద్ధమైన భూ చట్టాల ప్రశ్నలు,',
      heroAccent3: 'అధికారిక చట్టాలపై ఆధారపడినవి',
      heroSub3: 'RFCTLARR 2013, రాష్ట్ర కౌలు నిబంధనలు మరియు రెవెన్యూ కోడ్‌లపై ఖచ్చితమైన అనులేఖన సరిపోలికతో ప్రశ్నలు అడగండి.',
      heroPill3a: 'చట్టబద్ధమైన ఉల్లేఖనాలు',
      heroPill3b: 'జీరో భ్రాంతి',
      heroPill3c: 'న్యాయపరమైన ఉదాహరణలు',
      heroBadge4: 'సమగ్ర చట్టాల సమాహారం',
      heroHeadline4: 'ప్రామాణిక భూమి చట్టాలు',
      heroAccent4: '& విధానపరమైన చట్రాలు',
      heroSub4: '1,240+ డిజిటలైజ్డ్ కేంద్ర మరియు రాష్ట్ర చట్టాలు, హైకోర్టు తీర్పులు మరియు రీసర్వే నోటిఫికేషన్‌లను అన్వేషించండి.',
      heroPill4a: '1,240+ చట్టాలు',
      heroPill4b: 'సెమాంటిక్ శోధన',
      heroPill4c: 'మోడల్ విధానాలు',
      heroBtnExplore: 'వేదికను అన్వేషించండి',
      heroBtnLogin: 'లాగిన్ / రిజిస్టర్',
      heroBtnDashboard: 'డాష్‌బోర్డ్‌కు వెళ్లండి',
      statParcelsVal: '4,280+',
      statParcelsLbl: 'కాడస్ట్రల్ పార్సెల్‌లు',
      statParcelsSub: 'WGS-84 PostGIS ప్రాదేశిక బహుభుజాలు',
      statDistrictsVal: '52',
      statDistrictsLbl: 'రెవెన్యూ జిల్లాలు',
      statDistrictsSub: 'రాష్ట్ర పాలనా సూచిక ద్వారా పర్యవేక్షించబడుతున్నాయి',
      statInstrumentsVal: '1,240+',
      statInstrumentsLbl: 'చట్టబద్ధమైన పత్రాలు',
      statInstrumentsSub: 'చట్టాలు, రెవెన్యూ సర్క్యులర్లు మరియు ఆదేశాలు',
      statPrecisionVal: '99.4%',
      statPrecisionLbl: 'సాక్ష్య ఖచ్చితత్వం',
      statPrecisionSub: 'జీరో-భ్రాంతి సమాచార పునరుద్ధరణ',
      newBadge: 'పబ్లిక్ ల్యాండ్ రికార్డులు & పత్రాలు',
      newTitle: 'భూమి-దృష్టిలో కొత్తవి',
      newSub: 'ప్రజా అన్వేషణ కోసం ఇటీవల డిజిటలైజ్ చేయబడిన భూ రికార్డులు, చట్టబద్ధమైన సర్క్యులర్లు మరియు పాలనా సూచికలు అందుబాటులో ఉన్నాయి.',
      newViewAll: 'అన్ని రికార్డులను వీక్షించండి',
      newDeedTitle: 'నమోదిత డీడ్ & మ్యుటేషన్ స్థితి',
      newDeedDesc: 'నమోదిత భూమి పత్రాలు, మ్యుటేషన్ నోటీసులు మరియు ఖస్రా సర్వే ధృవీకరణ సంఖ్యల తక్షణ ఎలక్ట్రానిక్ శోధన.',
      newActTitle: 'RFCTLARR భూసేకరణ చట్టం, 2013',
      newActDesc: 'గ్రామీణ నష్టపరిహార గుణకాలు, 100% సోలేషియం భత్యం మరియు పునరావాస హక్కులపై ప్రామాణిక నిబంధనలు.',
      newLeasingTitle: 'మోడల్ వ్యవసాయ భూమి లీజు నిబంధనలు',
      newLeasingDesc: 'భూ యజమానులను రక్షిస్తూనే కౌలు రైతులకు సంస్థాగత రుణాలు మరియు పంట నష్టపరిహారాన్ని అందించే చట్రం.',
      newDilrmpTitle: 'DILRMP కాడస్ట్రల్ ఆధునికీకరణ',
      newDilrmpDesc: 'కంప్యూటరీకరించిన భూ రికార్డులు, డ్రోన్ ఆధారిత రీసర్వే మరియు భూమి రిజిస్ట్రేషన్ కోసం ప్రామాణిక నిర్వహణ విధానాలు.',
      newVelocityTitle: 'జిల్లా మ్యుటేషన్ వేగం & పెండింగ్',
      newVelocityDesc: '52 జిల్లాలలో పరిపాలనా పరిష్కార రేట్లు, పెండింగ్ దరఖాస్తులు మరియు సమ్మతి స్కోర్‌లను పర్యవేక్షించండి.',
      newAiTitle: 'సాక్ష్య ఆధారిత AI న్యాయ శోధన',
      newAiDesc: 'రాష్ట్ర భూ రెవెన్యూ చట్టాలపై హామీ ఇవ్వబడిన ఖచ్చితమైన ఉల్లేఖనాలతో ప్రశ్నలు అడగండి.',
      ctaTitle: 'సాక్ష్యాలతో భూ పరిపాలనను అన్వేషించడానికి సిద్ధంగా ఉన్నారా?',
      ctaSub: 'మా పబ్లిక్ పోర్టల్ ద్వారా ప్రాదేశిక పార్సెల్ కాడస్ట్రే, రాష్ట్ర రెవెన్యూ సూచికలను చూడండి లేదా చట్టాలను ప్రశ్నించండి.',
      ctaBtnExplore: 'పబ్లిక్ డేటాసెట్‌లను అన్వేషించండి',
      ctaBtnLogin: 'లాగిన్ / రిజిస్టర్',
      ctaBtnGovernance: 'రెవెన్యూ పాలనను చూడండి',
      ctaBtnGis: 'GIS మ్యాప్‌ను తెరవండి',
    },
  },
};

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  options: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'bhoomi_drishti_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr' || saved === 'te')) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  };

  const t = useMemo(() => DICTIONARY[language], [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      options: LANGUAGE_OPTIONS,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
