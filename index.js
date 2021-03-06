var _ = require( 'underscore' );
var async = require( 'async' );
var knex = require( 'knex' );


var kComparators = {
	$lt : '<',
	$lte : '<=',
	$gt : '>',
	$gte : '>='
};

var SQLTableContainer = function( options ) {
	if( options.connectionInfo && options.client ) {
		this._knex = knex( {
			client : 'postgres',
			connection : options.connectionInfo
		} );
	}
	else if( options.knex ) {
		this._knex = options.knex;
	}
	else {
		throw new Error( 'Must specify both connectionInfo and client or a knex instance' );
	}

	this._tableName = options.tableName;
	this._selectors = [];

	return this;
};

SQLTableContainer.prototype.add = function( item ) {
	// Supports adding either a single selector object or an array of selector objects.
	this._selectors = this._selectors.concat( item );
};

SQLTableContainer.prototype.reset = function() {
	this._selectors = [];
};

SQLTableContainer.prototype.stuff = function( callback ) {
	var _this = this;
	var recordsById = {};

	async.each( this._selectors, function( thisSelector, callback ) {
		thisSelector = _.extend( {
			fields : [],
			where : {}
		}, thisSelector );

		var qb = _this._knex( _this._tableName );

		thisSelector.fields = _.union( thisSelector.fields, [ 'id' ] ); // make sure we always select id, otherwise we can't merge multiple manifests as expected.
		qb.select( thisSelector.fields );
		
		buildQuery.call( qb, thisSelector.where );

		if( thisSelector.offset ) {
			qb.offset( thisSelector.offset );
		}

		if( thisSelector.limit ) {
			qb.limit( thisSelector.limit );
		}

		qb.exec( function( err, records ) {
			if( err ) return callback( err );
			_.each( records, function( thisRecord ) {
				var recordId = thisRecord.id;

				recordsById[ recordId ] = recordsById[ recordId ] || {};
				_.extend( recordsById[ recordId ], thisRecord );
			} );

			return callback();
		} );
	}, function( err ) {
			if( err ) return callback( err );

			// now all records are in recordsById, but we want the final payload to be an array, not a hash
			var containerContents = _.values( recordsById );
			callback( null, containerContents );
	} );
};

module.exports = SQLTableContainer;

/**
 * Supports $lt, $lte, $gt, $gte, $in, $nin, and $or
 * @param  {[type]} query   [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function buildQuery( query, options ) {
	var _this = this;
	options = _.defaults( options || {}, {
		comparator : '=',
		useOr : false
	} );

	Object.keys( query ).forEach( function( thisKey ) {
		var value = query[ thisKey ];

		var fieldName;

		if( thisKey === '$or' ) {
			_this.where( function() {
				buildQuery.call( this, value, {
					useOr : true
				} );
			} );
		}
		else if( thisKey === '$in' ) {
			fieldName = Object.keys( value )[ 0 ];
			if( options.useOr ) _this.orWhereIn( fieldName, value[ fieldName ] );
			else _this.whereIn( fieldName, value[ fieldName ] );
		}
		else if( thisKey === '$nin' ) {
			fieldName = Object.keys( value )[ 0 ];
			if( options.useOr ) _this.orWhereNotIn( fieldName, value[ fieldName ] );
			else _this.whereNotIn( fieldName, value[ fieldName ] );
		}
		else if( kComparators[ thisKey ] !== undefined ) {
			buildQuery.call( _this, value, {
				comparator : kComparators[ thisKey ],
				useOr : options.useOr
			} );
		}
		// only supported in postgres 9.4
		else if( thisKey.indexOf( '.' ) !== -1 ) {
			var keyParts = thisKey.split( '.' );
			var columnName = keyParts[ 0 ];
			var propertyName = keyParts[ 1 ];
			if( options.useOr ) _this.orWhereRaw( columnName + "->>'" + propertyName + "' " + options.comparator + " ?", value );
			else _this.whereRaw( columnName + "->>'" + propertyName + "' " + options.comparator + " ?", value );
		}
		else {
			if( options.useOr ) _this.orWhere( thisKey, options.comparator, value );
			else _this.where( thisKey, options.comparator, value );
		}
	} );
}