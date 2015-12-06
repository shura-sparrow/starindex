starindex.graphView = Backbone.View.extend({
    chart: undefined,
    colors: ["#5fb503", "#efcc26","#FF6600", "#FF9E01", '#FCD202', '#B0DE09', '#FF0F00'],
    titles: ["lastfm", "blue line"],
    valueFields: ['lastfm'],
    chartData: [],
    rawData: [],
    legend: false,
    axisCounter: 0,
    defaultParams: {
        parseDates: true,
        minPeriod: 'DD',
        dashLength: 1,
        gridAlpha: 0.15,
        axisColor: "#DADADA"
    },
    initialize: function(){
        var that = this;
        if (!this.model) {
            that.showGraph();
            that.createChart();
            var categoryAxis = that.chart.categoryAxis;
            for (var graph in defaultParams) {
                categoryAxis[graph] = defaultParams[graph];
            }

            that.createNewGraph({
                lineColor: that.colors[0],
                lineThickness: 2,
                hideBulletsCount: 50,
                bullet: "round",
                bulletBorderColor: "#FFFFFF",
                negativeLineColor: '#FF0000',
                title: that.titles[0],
                valueField: that.valueFields[0]
            });
        }
        if (this.model) {
            this.model.bind('change:onGraph', this.modelDataChange, this);
            this.model.bind('change:active', this.modelDataChange, this);
        }
    },
    showGraph: function(){
        this.rawData = starindex.rawData;
        this.names = starindex.activityName;
        this.prepareData(this.names);
    },
    modelDataChange: function(){
        var counter = 0;
        this.chartData = [];
        var me = this;
        var s = this.model.filter(function(item){
            return ((item.get('active') == true) && item.get('onGraph'));
        });
        if (s.length) {
            var length = 1, it = 0;
            for (var dItem in s) {
                if (s[dItem].get('data').length > length) {
                    length = s[dItem].get('data').length;
                    it = dItem;
                }
            }
            for (var date_item in s[it].get('data')) {
                var date = s[it].get('data')[date_item]['date'].split('-');
                date = new Date(date[0], parseInt(date[1]) - 1, date[2]);
                this.chartData.push({
                    date: date
                });
            }
            this.titles = [];
            this.valueFields = [];
            _.each(s, function(item){
                me.titles.push(item.get('label'));
                me.valueFields.push(item.get('label'));
                for (var counter = 0; counter < length; counter++) {
                    if (item.get('data')[counter] !== undefined)
                        me.chartData[counter][item.get('label')] = item.get('data')[counter]['value'];
                    else {
                        for (var m = counter; m >= 0; m--) {
                            if (item.get('data')[m] !== undefined) {
                                me.chartData[counter][item.get('label')] = item.get('data')[m]['value'];
                                break;
                            }
                        }
                    }
                }
            });
            $('#main-stat-graph').show();
            $('#period-choose').removeClass('waiting');
            this.createChart();
            var categoryAxis = this.chart.categoryAxis;
            for (var graph in defaultParams) {
                categoryAxis[graph] = defaultParams[graph];
            }
            _.each(s, function(item, index){
                this.axisCounter++;
                me.createNewGraphHandler(item, index);
            });
        } else {
            this.axisCounter = 0;
            $('#main-stat-graph').hide();
            $('#period-choose').removeClass('waiting');
        }
    },
    prepareData: function(names) {
        var date = '', values = {};
        for (var i in this.rawData) {
            for (var j in this.rawData[i]) {
                values = {};
                date = this.rawData[0][j]['date'].split('-');
                date = new Date(date[0], parseInt(date[1]) - 1, date[2]);
                for (var k in this.rawData[i][j]) {
                    values[names[i]] = parseInt(this.rawData[i][j].value);
                }
                values.date = date;
                this.chartData.push(values);
            }
        }
        this.chartData.reverse();
    },
    createNewGraphHandler: function(item, index){
        var that = this;
        var options = {
            lineColor: item.get('color'),
            lineThickness: 2,
            hideBulletsCount: 50,
            bullet: "round",
            bulletBorderColor: "#FFFFFF",
            negativeLineColor: '#FF0000',
            valueField: that.valueFields[index]
        };
        this.createNewGraph(options);
    },
    createNewGraph: function(options){
        if (this.axisCounter == 1) {
            var newAxis = new AmCharts.ValueAxis();
            newAxis.axisAlpha = 0;
            newAxis.offset = this.axisCounter*50;
            newAxis.labelsEnabled = true;
            this.chart.addValueAxis(newAxis);
        }


        var graph = new AmCharts.AmGraph();

        for (var i in options) {
            graph[i] = options[i];
        }

        graph.valueAxis = newAxis;
        this.chart.addGraph(graph);
       this.chart.write("main-stat-graph");
    },
    createChart: function(){
        this.chart = new AmCharts.AmSerialChart();
        AmCharts.shortMonthNames = starindex.date['monthsShort' + starindex.language];
        this.chart.pathToImages = starindex.root + "/im/amcharts/";
        this.chart.zoomOutButton = {
            backgroundColor: '#000000',
            backgroundAlpha: 0.15
        };
        this.chart.dataProvider = this.chartData;
        this.chart.categoryField = "date";
        this.chart.balloon.bulletSize = 5;
        this.chart.marginRight = 0;

        // SCROLLBAR
        var chartScrollbar = new AmCharts.ChartScrollbar();
        this.chart.addChartScrollbar(chartScrollbar);
        if (this.legend) {
            // LEGEND
            var legend = new AmCharts.AmLegend();
            legend.marginLeft = 110;
            this.chart.addLegend(legend);
        }
        // CURSOR
        var chartCursor = new AmCharts.ChartCursor();
        chartCursor.cursorPosition = "mouse";
        chartCursor.pan = true; // set it to fals if you want the cursor to work in "select" mode
        this.chart.addChartCursor(chartCursor);
        // WRITE
        this.chart.write("main-stat-graph");
    },
    zoomChart: function(){
        this.chart.zoomToIndexes(0, 7);
    }
});
if ($('#statDetails').length) {
    new starindex.graphView({
        el: $('#statDetails'),
        model: starindex.statisticsmodel
    });
}
