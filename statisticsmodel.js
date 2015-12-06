starindex.statisticsModel = Backbone.Model.extend({
    url: '',
    defaults: {
        name: undefined,
        active: false,
        label: undefined,
        locality: undefined,
        category: undefined,
        onGraph: false,
        color: ''
    }
});
starindex.statisticsModelCollection = Backbone.Collection.extend({
    url: 'http://starindex.ru/artist',
    model: starindex.statisticsModel,
    fetchData: {
        id: null,
        date: '',
        models: []
    },
    locality: 0,
    fetch: function(options) {
      options = _.extend({}, {data: this.fetchData}, options);
      return Backbone.Collection.prototype.fetch.call(this, options);
     }
});
starindex.statisticsmodel = new starindex.statisticsModelCollection();

