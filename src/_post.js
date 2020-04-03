

export function Post(postdata, agifunc) {

  return new Promise( (resolve, reject) => {

    try {

      agifunc[ postdata.sh ](postdata)
        .then( result => { resolve(result); } )
        .catch( err => { reject(err); } );

    }
    catch (e) {

      console.info('sh error', e);
      reject( '{ err: "bad sh param" }' );

    }

  } );

}



