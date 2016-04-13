var config = require('./config.json')
var pg = require('knex')({client:'pg',connection:config.connection})

var express = require('express')
var app = express()

//set it to use jade
app.set('view engine', 'jade')

//app.use('/static', express.static('public'))
app.use('/components',express.static(__dirname + '/node_modules'))
app.use('/static',express.static(__dirname + '/app')) // Is this right?

app.get('/', (req,res) => {
	res.render('index')
})

app.get('/api/:type', (req,res) => {
	switch(req.params.type){
		case "boundaries_csas":
			pg.select().from('boundaries.csas').then((data) => {
				return res.json(data)
			})
		break
		case "boundaries_nsas":
			pg.select().from('boundaries.nsas').then((data) => {
				return res.json(data)
			})
		break
		default:
			return res.json({'data':[]})
	}
})

app.listen(8080,() => {
	console.log("Listening on port 8080")
})
