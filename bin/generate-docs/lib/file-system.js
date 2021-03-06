/** @format */
/**
 * External dependencies
 */
const { isArray, uniq } = require( 'lodash' );
const fs = require( 'fs' );
const path = require( 'path' );
const recast = require( 'recast' );
const types = require( 'ast-types' );
const { namedTypes } = types;

/**
 * Internal dependencies
 */
const { camelCaseDash } = require( './formatting' );

const ANALYTICS_FOLDER = path.resolve( __dirname, '../../../client/analytics/components/' );
const PACKAGES_FOLDER = path.resolve( __dirname, '../../../packages/components/src/' );
const DOCS_FOLDER = path.resolve( __dirname, '../../../docs/components/' );

/**
 * Remove all files in existing docs folder.
 * @param { String } route Route of the folder to clean.
 */
function deleteExistingDocs( route ) {
	const folderRoute = path.resolve( DOCS_FOLDER, route );

	if ( ! isDirectory( folderRoute ) ) {
		fs.mkdirSync( folderRoute );
		return;
	}

	const files = fs.readdirSync( folderRoute );
	files.map( file => {
		if ( 'README.md' === file ) {
			return;
		}
		fs.unlinkSync( path.resolve( folderRoute, file ) );
	} );
}

/**
 * Get an array of files exported from in the given file
 *
 * @param { string } filePath The file to parse for exports.
 * @return { string } Formatted string.
 */
function getExportedFileList( filePath ) {
	const content = fs.readFileSync( filePath );
	const ast = recast.parse( content );
	const files = [];
	types.visit( ast, {
		// This method will be called for any node with .type "ExportNamedDeclaration":
		visitExportNamedDeclaration: function( nodePath ) {
			const { node } = nodePath;
			if (
				namedTypes.Literal.check( node.source ) &&
				isArray( node.specifiers ) &&
				namedTypes.ExportSpecifier.check( node.specifiers[ 0 ] )
			) {
				if ( -1 === node.source.value.indexOf( 'use-filters' ) ) {
					files.push( node.source.value );
				}
			}
			// Keep traversing this path…
			this.traverse( nodePath );
		},
	} );

	return files;
}

/**
 * Return the markdown file name for a given component file.
 *
 * @param { string } filepath File path for this component.
 * @param { string } route Folder where the docs must be stored.
 * @param { boolean } absolute Whether to return full path (true) or just filename (false).
 * @return { string } Markdown file name.
 */
function getMdFileName( filepath, route, absolute = true ) {
	const fileParts = filepath.split( '/components/' );
	if ( ! fileParts || ! fileParts[ 1 ] ) {
		return;
	}
	const name = fileParts[ 1 ].replace( 'src/', '' ).split( '/' )[ 0 ];
	if ( ! absolute ) {
		return name + '.md';
	}
	return path.resolve( DOCS_FOLDER + '/' + route + '/', name + '.md' );
}

/**
 * Get an array of files exported from in the given file
 *
 * @param { array } files A list of files, presumably in the components directory.
 * @param { string } basePath The absolute path to the components directory.
 * @return { array } Updated array with absolute paths to all files.
 */
function getRealFilePaths( files, basePath = PACKAGES_FOLDER ) {
	files.sort();
	return files.map( file => {
		const fullPath = path.resolve( basePath, file );
		if ( isFile( fullPath ) ) {
			return fullPath;
		}
		if ( isFile( `${ fullPath }.js` ) ) {
			return `${ fullPath }.js`;
		}
		if ( isFile( `${ fullPath }/index.js` ) ) {
			return `${ fullPath }/index.js`;
		}
		const folderName = path.basename( fullPath );
		if ( isFile( `${ fullPath }/${ folderName }.js` ) ) {
			return `${ fullPath }/${ folderName }.js`;
		}

		return fullPath;
	} );
}

/**
 * Check if a directory exists and is not a file.
 *
 * @param { string } dir A directory path to test.
 * @return { boolean } True if this path exists and is a directory.
 */
function isDirectory( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		return false;
	}
	const stats = fs.statSync( dir );
	return stats && stats.isDirectory();
}

/**
 * Check if a file exists and is not a directory.
 *
 * @param { string } file A file path to test.
 * @return { boolean } True if this path exists and is a file.
 */
function isFile( file ) {
	if ( ! fs.existsSync( file ) ) {
		return false;
	}
	const stats = fs.statSync( file );
	return stats && stats.isFile();
}

/**
 * Create a table of contents given a list of markdown files.
 *
 * @param { array } files A list of files, presumably in the components directory.
 * @param { string } route Folder where the docs are stored.
 * @param { string } title Title of the TOC section
 * @return { string } TOC contents.
 */
function getTocSection( files, route, title ) {
	const mdFiles = files.map( f => getMdFileName( f, route, false ) ).sort();

	const toc = uniq( mdFiles ).map( doc => {
		const name = camelCaseDash( doc.replace( '.md', '' ) );
		return `    * [${ name }](components/${ route }/${ doc })`;
	} );

	return [
		'  * [' + title + '](components/' + route + '/)',
		...toc,
	];
}

module.exports = {
	DOCS_FOLDER,
	ANALYTICS_FOLDER,
	PACKAGES_FOLDER,
	deleteExistingDocs,
	getExportedFileList,
	getMdFileName,
	getRealFilePaths,
	getTocSection,
};
