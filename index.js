var config = require('./config.json')
var pg = require('knex')({client:'pg',connection:config.connection})
var bodyParser = require('body-parser')
var express = require('express')
var landing = require('./lib/landing')
var map = require('./lib/map')
var app = express()


//set it to use jade
app.set('view engine', 'jade')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) //?

app.use('/app',express.static('./app'))
app.use('/node_modules',express.static('./node_modules'))

app.use('/',landing)
app.use('/map',map(pg))

app.get('/init', (req,res) => {
	res.json(options)
})

app.get('/boundaries/:type', (req,res) => {
	var query = null
	if(req.params.type == 'csas'){
		query = pg.select(['gid','geojson']).from('boundaries.csas')
	}
	else if(req.params.type == 'nsas'){
		query = pg.select(['gid','geojson']).from('boundaries.nsas')
	}
	else if(req.params.type == 'subwatersheds'){
		query = pg.select(['gid','geojson']).from('boundaries.subwatersheds')
	}
	else{
		return res.json({err:'boundary not listed or not provided'})
	}
	if(req.query && req.query.filter){
		query = query.whereIn('gid',req.query.filter)
	}
	return query.then((data) => {
		return res.json(data)
	})
})


app.listen(8080,() => {
	console.log("Listening on port 8080")
})
