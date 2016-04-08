var gulp = require('gulp')
var knex = require('knex')
var csv = require('fast-csv')
var fs = require('fs')
var Promise = require('bluebird')
var _ = require('lodash')
var changeCase = require('case')
var tidy = require('tidyaddr-js')
var config = require('../config.json')
var pg = null

gulp.task('load_cg_csv', () => {
    pg = knex({client:'pg',connection:config.connection})
    // Make sure that boundaries schema exists
    return pg.raw('CREATE SCHEMA IF NOT EXISTS "layers"').then(() => {
        //var filename11 = "src/data/layers/cg/cg11.csv"
        //var filename15 = "src/data/layers/cg/cg15.csv"
        var filename = "src/data/layers/cg/cg_types.csv"
        var arr = []
        var p = Promise.defer()
        var stream = fs.createReadStream(filename)
        var csvStream = csv().on("data", (data) => {
            arr.push(data)
        })
        .on("end",() => {
            var types = _.zipObject(arr[0],arr[1])
            p.resolve(types)
        })
        stream.pipe(csvStream)
        return p.promise
    })
    .then((types) => {
        var filename = "src/data/layers/cg/cg11.csv"
        var arr = []
        var p = Promise.defer()
        var stream = fs.createReadStream(filename)
        var csvStream = csv().on("data", (data) => {
            arr.push(data)
        })
        .on("end",() => {
            var header = arr[0]
            var rows = _.tail(arr)
            var objs = _.map(rows,(r) => {
                r = _.map(r,(s) => {
                    if(s === 'TRUE'){return true}
                    if(s === 'FALSE'){return false}
                    if(s === ''){return null}
                    if(_.isNil(s)){return null}
                    return s
                })
                while(r.length < header.length){
                    r.push(null)
                }
                var zipped = _.zipObject(header,r)
                zipped['data_year'] = '2011'
                return zipped
            })
            p.resolve({types:types,'cg11':objs})
        })
        stream.pipe(csvStream)
        return p.promise
    })
    .then((obj) => {
        var filename = "src/data/layers/cg/cg15.csv"
        var arr = []
        var p = Promise.defer()
        var stream = fs.createReadStream(filename)
        var csvStream = csv().on("data", (data) => {
            arr.push(data)
        })
        .on("end",() => {
            var header = arr[0]
            var rows = _.tail(arr)
            var objs = _.map(rows,(r) => {
                r = _.map(r,(s) => {
                    if(s === 'TRUE'){return true}
                    if(s === 'FALSE'){return false}
                    if(s === ''){return null}
                    if(_.isNil(s)){return null}
                    return s
                })
                while(r.length < header.length){
                    r.push(null)
                }
                var zipped = _.zipObject(header,r)
                zipped['data_year'] = '2015'
                return zipped
            })
            p.resolve({types:obj.types,'cg11':obj.cg11,'cg15':objs})
        })
        stream.pipe(csvStream)
        return p.promise
    })
    .then((obj) =>{
        obj.types['data_year'] = 'text'
        var all = _.union(obj.cg11,obj.cg15)
        var grpd = _.groupBy(all,'site_id')
        var ungrpd = _.map(grpd,(g) => {
            var sorted = _.sortBy(g,'data_year')
            sorted = _(sorted).reverse().value()
            var latest = sorted[0]
            var rest = _.tail(sorted)
            var ret = _.reduce(rest,(result,value) => {
                _.forEach(_.toPairs(obj.types),(kv) => {
                    if(kv[1] === 'boolean'){
                        result[kv[0]] = (result[kv[0]] && value[kv[0]])
                    }
                })
                result['data_year'] = value['data_year']
                return result
            },latest)
            ret['address'] = tidy.cleanLine(ret.address).tidyaddress
            //ret['address'] = changeCase.title(ret['address'])
            _.forEach(_.toPairs(obj.types),(kv) => {
                if(kv[1] === 'text'){
                    if(!(_.isNil(kv[0]))){
                        ret[kv[0]] = changeCase.title(ret[kv[0]])
                    }
                }
                if(ret[kv[0]] == ''){
                    ret[kv[0]] = null
                }
            })
            return ret

        })
        return {types:obj.types,cg:ungrpd}
    })
    .then((obj) => {
        return pg.schema.createTableIfNotExists('layers.cg',(table) => {
            table.increments('gid').primary()
            _.forIn(obj.types,(v,k) => {
                if(k === 'site_id'){
                    table.text(k).unique()
                    return
                }
                if(v === 'text'){table.text(k)}
                if(v === 'float'){table.float(k)}
                if(v === 'boolean'){table.boolean(k)}
                if(v === 'integer'){table.integer(k)}
            })
        }).then(() => {
            return obj.cg
        })
    }).then((cg) => {
        return pg.raw('alter table layers.cg add column geometry geometry(Point,4326)')
            .then(() => {
                return cg
            })
    }).then((cg) => {
        return pg('layers.cg').insert(cg)
    }).then(() => {
        return pg.raw('update layers.cg set geometry = ST_SetSRID(ST_MakePoint(point_x,point_y),4326)')
    }).then(() => {
        return pg.destroy()
    })
})
