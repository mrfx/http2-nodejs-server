import * as db from "./mariadb";

import { Post } from "../_post";

export const post = (postdata) => new Post(postdata, agifunc);

const agifunc = {



  checkEmail: function (postdata) {

    return new Promise( (resolve, reject) => {

      const param = {
        em: postdata['email']
      }
      db.query('select email from hotelowner where `email` = :em', param)
        .then( res => { resolve (res); })
        .catch( err => { reject(err); });

    });

  },




  getDataByEmail: function (postdata) {

    return new Promise( (resolve, reject) => {

      const param = {
        em: postdata['email']
      }
      db.query('select * from hotelowner where `email` = :em', param)
        .then( res => { resolve (res); })
        .catch( err => { reject(err); });

    });

  },






updateInsertTableRow: function  (table, cols, vals, whereArr) {

    return new Promise( (resolve, reject) => {

      /* @todo
          need testing
       */
      let param = {
        table: table
      }

      let fieldsString = '';
      for(let i=0; i<cols.length;i++) {
        param['col' +i] = cols[i];
        if (i>0) fieldsString += ',';
        fieldsString += ':col' + i;;
      }

      let valsString = '';
      let updateString = '';
      for(let i=0; i<vals.length;i++) {
        param['val' +i] = vals[i];
        if (i>0) {
          valsString += ',';
          updateString += ',';
        }
        valsString += ':val' + i;
        updateString += ':col' + i + ' = ' + ':val' + i;
      }

      let qstring = `INSERT INTO :table (${fieldsString}) VALUES (${valsString}) ON DUPLICATE KEY UPDATE ${updateString};`;
      console.info(qstring);
      db.query( qstring, param)
        .then( res => { resolve (res); })
        .catch( err => { reject(err); });

    });

  },



  createUser: function (postdata) {

    return new Promise( (resolve, reject) => {

      const hotelOwner = JSON.parse(postdata.hotelOwner);
      const hjson = JSON.stringify(hotelOwner);
      const param = {
        em: hotelOwner.email,
        pass: hotelOwner.password,
        hjson: hjson
      }

      // console.info('param', param);

      db.query('insert into hotelowner (id,password,email,json) values (NULL,:pass,:em,:hjson)', param)
        .then( res => { resolve(res); } )
        .catch( err => { reject(err); } );


    });

  }





}








