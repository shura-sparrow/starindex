var starindex = {
    //views
    activitiesDetails: null,
    activitiesList: null,
    graphView: null,
    //models
    statisticsModel: null,
    statisticsModelCollection: null,
    language: $('html').attr('lang'),
    routes: [],
    localStorage: 'localStorage' in window && window['localStorage'] !== null,
    currentPeriod: 30
}

