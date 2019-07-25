<?php

namespace Maps\MediaWiki\Api;

use ApiBase;
use Maps\MapsFactory;

/**
 * @licence GNU GPL v2++
 * @author Jeroen De Dauw < jeroendedauw@gmail.com >
 */
class ApiGeocode extends ApiBase {

	public function execute() {
		if ( !$this->getUser()->isAllowed( 'geocode' ) || $this->getUser()->isBlocked() ) {
			$this->dieWithError( 'badaccess-groups' );
		}

		$geocoder = MapsFactory::newDefault()->getGeocoder();

		$params = $this->extractRequestParams();

		$results = [];

		foreach ( array_unique( $params['locations'] ) as $location ) {
			$result = $geocoder->geocode( $location );

			$results[$location] = [
				'count' => $result === null ? 0 : 1,
				'locations' => []
			];

			if ( $result !== null ) {
				$results[$location]['locations'][] = [
					'latitude' => $result->getLatitude(),
					'longitude' =>  $result->getLongitude()
				];
			}

			$this->getResult()->setIndexedTagName( $results[$location]['locations'], 'location' );
		}

		$this->getResult()->addValue(
			null,
			'results',
			$results
		);
	}

	public function getAllowedParams() {
		return [
			'locations' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true,
				ApiBase::PARAM_ISMULTI => true,
			],
		];
	}

	public function getParamDescription() {
		return [
			'locations' => 'The locations to geocode',
		];
	}

	public function getDescription() {
		return [
			'API module for geocoding.'
		];
	}

	protected function getExamples() {
		return [
			'api.php?action=geocode&locations=new york',
			'api.php?action=geocode&locations=new york|brussels|london',
		];
	}

}
