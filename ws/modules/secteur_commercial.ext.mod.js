/**
Copyright 2017 ToManage

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

@author    ToManage SAS <contact@tomanage.fr>
@copyright 2014-2017 ToManage SAS
@license   http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
International Registered Trademark & Property of ToManage SAS
*/

"use strict";

const moment = require('moment'),
	fixedWidthString = require('fixed-width-string'),
	fs = require('fs'),
	path = require("path"),
	_ = require('lodash');

exports.name = 'secteur_commercial';
exports.version = 1.07;
exports.enabled = true;
exports.description = 'Secteur commercial OTC';

exports.rights = {
	isRead: true,
	isWrite: true,
	isDel: true,
	isExport: true,
	isImport: true,
	isCancel: true,
	isReopen: true,
};


exports.menus = {
	"menu:Secteur": {
		"position": 30000,
		"perms": "employee.isRead",
		"enabled": "$conf->commande->enabled",
		"usertype": 2,
		"icon": "fa-tags",
    "title": "Secteurs commerciaux",
		"submenus": {
			"menu:secteurcommercialgestion": {
				"position": 1,
				nuxt: "/secteur_commercial",
				"perms": "employee.isRead",
				"enabled": true,
				"usertype": 2,
				"icon": "fa-cogs",
				"title": "Gestion des secteurs"
			},
      "menu:secteurcommercialstats": {
        "position": 2,
        nuxt: "/secteur_commercial/stats",
        "perms": "employee.isRead",
        "enabled": true,
        "usertype": 2,
        "icon": "fa-money",
        "title": "Statistiques par secteurs"
      }
		}
	},
};

exports.filters = {
	"secteur_commercial": {
    "entity": {
      "displayName": "Entity",
      "backend": "entity",
      "type": "string"
    },
	},
};
let fk_departements_francais;

F.once('database', function () {
  const Dict = INCLUDE('dict');

  Dict.dict({
    dictName: "fk_departements_francais",
    object: true
  }, function (err, docs) {
    fk_departements_francais = docs;
  });
});

F.once('database', function () {
	const ModulesModel = MODEL('modules').Schema;

	ModulesModel.insert(exports, function (err, doc) {
		if (err)
			return console.log("Error update module {0} : {1} ".format(exports.name, err));
	});
});


F.once('database', function () {
	$SAVE('Module', {
		_id: exports.name,
		description: exports.description,
		enabled: exports.enabled,
		icon: exports.icon,
		rights: exports.rights,
		version: exports.version
	}, function (err) {
		if (err)
			return console.log(err);
		console.log("Install module {0} ok".format(exports.name));
	});
});
