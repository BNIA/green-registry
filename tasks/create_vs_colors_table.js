var gulp = require('gulp')
var _ = require('lodash')
var knex = require('knex')
var path = require('path');
var configPath = path.join(process.cwd(),'config/config.json');
var config = require(configPath);

gulp.task('create_vs_colors_table', () => {
    var pg = knex({client:'pg',connection:config.connection,pool:{min:0,max:7}})
    pg.select('column_name')
        .from('information_schema.columns')
        .where('table_name','data')
        .where('table_schema','vital_signs')
        .whereNotIn('column_name',['csa_id','csa','id'])
        .map(row => row.column_name)
        .then(data => pg.schema.createTable('vital_signs.colors', table => {
            table.increments('id')
            table.string('csa')
            table.integer('csa_id')
            _.forIn(data,d => table.string(d).defaultTo(null))
        }))
        .then(() => pg.raw('INSERT INTO vital_signs.colors(id,csa,csa_id) SELECT id,csa,csa_id from vital_signs.data'))
        .then(() => pg.destroy())
})
