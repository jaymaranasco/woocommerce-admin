/** @format */
/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Router, Route, Switch } from 'react-router-dom';
import { Slot } from 'react-slot-fill';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from 'layout/header';
import { Controller, getPages } from './controller';
import history from 'lib/history';
import Notices from './notices';

class Layout extends Component {
	render() {
		const { isEmbeded, ...restProps } = this.props;
		return (
			<div className="woocommerce-layout">
				<Slot name="header" />

				<div className="woocommerce-layout__primary" id="woocommerce-layout__primary">
					<Notices />
					{ ! isEmbeded && (
						<div className="woocommerce-layout__main">
							<Controller { ...restProps } />
						</div>
					) }
				</div>
			</div>
		);
	}
}

Layout.propTypes = {
	isEmbededLayout: PropTypes.bool,
};

export class PageLayout extends Component {
	render() {
		return (
			<Router history={ history }>
				<Switch>
					{ getPages().map( page => {
						return <Route key={ page.path } path={ page.path } exact component={ Layout } />;
					} ) }
					<Route component={ Layout } />
				</Switch>
			</Router>
		);
	}
}

export class EmbedLayout extends Component {
	render() {
		return (
			<Fragment>
				<Header sections={ wcSettings.embedBreadcrumbs } isEmbedded />
				<Layout isEmbeded />
			</Fragment>
		);
	}
}