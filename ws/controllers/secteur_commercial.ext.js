/**
Copyright 2019 ToManage

Licensed under the Server Side Public License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://lists.opensource.org/pipermail/license-review_lists.opensource.org/2018-November/003836.html

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

@author    ToManage SAS <contact@tomanage.fr>
@copyright 2014-2019 ToManage SAS
@license   http://lists.opensource.org/pipermail/license-review_lists.opensource.org/2018-November/003836.html SSPL License, Version 2.0
International Registered Trademark & Property of ToManage SAS
*/



"use strict";
const fs = require('fs'),
	csv = require('csv'),
	_ = require('lodash'),
	moment = require("moment"),
	async = require('async'),
	mongoose = require('mongoose');

const Dict = INCLUDE('dict');

const round = MODULE('utils').round;

exports.install = function () {
  var object = new Object();
	F.route('GET /erp/api/v2/secteur_commercial/{_id}', ['*SecteurCommercial --> @get', 'authorize']);
  F.route('GET /erp/api/secteur_commercial/getForDd', object.getForDd, ['authorize']);
  F.route('GET /erp/api/v2/secteur_commercial/caSecteur', ['*SecteurCommercial --> @caSecteur', 'authorize', 500000]);
};

function Object() { }

Object.prototype = {
  	getForDd: function () {
    var self = this;

    var result = {};
    DATABASE("secteur_commercial").find({},{name:1}).toArray(function(err, result) {
        self.json(result);
      });
    }
}
