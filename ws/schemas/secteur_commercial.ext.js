"use strict";

const async = require('async'),
    _ = require('lodash'), {
        ObjectID
    } = require('mongodb'),
  	moment = require("moment");

const COLLECTION = 'secteur_commercial';
const duringYear = 2;

NEWSCHEMA("SecteurCommercial", function (schema) {
      schema.define("_id", "String(24)");
      schema.define("name", "String");
      schema.define("potentiel", Number);
      schema.define("departement_fr", "[]");
      schema.define("commercial", "String(24)");

      schema.setPrepare(function (name, val, index, model) {
        //console.log("40 ", model);
        switch (name) {
          case "_id":
            return val ? val.ObjectID() : null;
          case "commercial":
            return val ? val.ObjectID() : null;
        }
      });

      schema.setQuery(function ($) {
        let query = U.clone($.query);

        if ($.query) //controller
          query = $.query;

        // console.log('528', query)
        const OrderDB = DATABASE(COLLECTION);
        const quickSearch = query.quickSearch;
        const paginationObject = MODULE('helper').page(query);
        const sort = MODULE('helper').sort(query);
        const limit = paginationObject.limit;
        const skip = paginationObject.skip;

        const FilterMapper = MODULE('helper').filterMapper;
        const filterMapper = new FilterMapper();

        let accessRollSearcher;
        let contentSearcher;
        let waterfallTasks;
        let contentType = query.contentType;

        let filter = query.filter || {};
        let key;

        let filterObject = {};
        let optionsObject = {};
        let matchObject = {};

        // ?????????????????????????????????
        // const pastDue = filter.pastDue;

        if (quickSearch) {
          let regExp = new RegExp(quickSearch.trim().replace(/ /g, '|'), 'ig');
          matchObject['$or'] = [{
            name: regExp
          }];
          filter = {};
        }

        filterObject.$and = [];

        if (filter && typeof filter === 'object') {
          // console.log('460', filter)
          filterObject.$and.push(filterMapper.mapFilter(filter, {
            contentType: contentType
          })); // caseFilter(filter);
        }

        accessRollSearcher = function (cb) {
          const accessRoll = MODULE('helper').accessRoll;
          return cb(null, null);
          accessRoll(options.user, self, cb);
        };

        contentSearcher = function (ids, cb) {
          let newQueryObj = {};
          const ObjectId = MODULE('utils').ObjectId;

          let query = [{
            $match: filterObject
          },
          {
            $match: matchObject
          },
          {
            $project: {
              name: 1,
              potentiel: 1,
              departement_fr: 1,
              commercial: 1
            }
          },
          {
            $lookup: {
              from: 'Employees',
              localField: 'commercial',
              foreignField: '_id',
              as: 'commercial'
            }
          },
          {
            $project: {
              commercial: {
                $arrayElemAt: ['$commercial', 0]
              },
              name: 1,
              potentiel: 1,
              departement_fr: 1
            }
          },{
            $project: {
              commercial: {
                _id: '$commercial._id',
                fullName: {
                  $concat: ['$commercial.name.last', ' ', '$commercial.name.first']
                }
              },
              name: 1,
              potentiel: 1,
              departement_fr: 1
            }
          },
          {
            $match: newQueryObj
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: 1
              },
              root: {
                $push: '$$ROOT'
              }
            }
          }, {
            $unwind: '$root'
          }, {
            $project: {
              _id: '$root._id',
              commercial: '$root.commercial',
              potentiel: '$root.potentiel',
              departement_fr: '$root.departement_fr',
              name: '$root.name',
              total: 1,
              totalAll: {
                count: "$total",
              }
            }
          }, {
            $project: {
              // removable: 1,
              ID: 1,
              commercial: 1,
              potentiel: 1,
              departement_fr: 1,
              name: 1,
              total: 1,
              totalAll: 1
            }
          },
          {
            $sort: sort
          }
          ];

          if (skip)
            query.push({
              $skip: skip
            });

          if (limit)
            query.push({
              $limit: limit
            });

          OrderDB.aggregate(query).toArray(cb);
        };

        waterfallTasks = [accessRollSearcher, contentSearcher];

        async.waterfall(waterfallTasks, (err, result) => {

          let count;
          let firstElement;
          let response = {};

          if (err)
            return $.invalid(err);

          firstElement = result[0];
          count = firstElement && firstElement.total ? firstElement.total : 0;
          response.total = count;
          response.totalAll = firstElement && firstElement.totalAll ? firstElement.totalAll : {
            count: 0,
            Status: []
          };
          response.data = result;

          // console.log("1084", response)
          $.success(response);
        });
      });

      schema.setInsert(function ($) {
          const DB = DATABASE(COLLECTION);
          const SeqModel = MODEL('Sequence').Schema;

          let secteur = $.clean();
          async.waterfall([
              function (wCb) {
                  DB.insertOne(secteur, (err, doc) => {
                      if (err) return wCb(err);
                      return wCb(null, doc);
                  });
              }
          ], function (err, result) {
              if (err) return $.invalid(err);
              return $.success(result.insertedId);
          });
      });

      schema.setGet(function ($) {
          const DB = DATABASE(COLLECTION);
          DB.findOne({
              _id: $.params._id.ObjectID()
          }, (err, secteur) => {
            if (err)
                return $.invalid(err);

                async.parallel({
                  object: function (pCb) {
                      return pCb(null, secteur);
                  },
                  commercial: function (pCb) {
                      const EmployeeDB = DATABASE('Employees');
                      if (!secteur || !secteur.commercial) return pCb(null, {})
                      EmployeeDB.aggregate([
                        {
                          $match: {
                            _id: secteur.commercial,
                          }
                        }, {
                          $project: {
                            _id: 1,
                            name: 1,
                          }
                        }, {
                          $project: {
                            _id: 1,
                            name: 1,
                            fullName: {
                              $concat: ['$name.first', ' ', '$name.last']
                            },
                          }
                        },{
                          $project: {
                            _id: 1,
                            name: 1,
                            fullName: 1,
                          }
                        }
                      ]).toArray((err, docs) => {
                          if (err)  return pCb("err :  Secteur setGet" + err);
                          pCb(null, docs.length && docs[0] || {});
                        })
                  },
                  clientZone: function (pCb) {
                    const CustomerDB = DATABASE('Customers');
                    if (!secteur || !secteur.departement_fr) return pCb(null, {})
                    var depCode = secteur.departement_fr.map(function(item) { return item['numero']; });
                    CustomerDB.aggregate([
                      {
                        $match: {
                          "salesPurchases.zone": {
                    				    $in: depCode
                    			},
                          "salesPurchases.isCustomer":true,
                          lastOrder:{ $exists: true, $ne: null },
                        }
                      }, {
                        $project: {
                          _id: 1,
                          name: 1,
                          address: 1,
                          salesPurchases: 1,
                          lastOrder: 1,
                        }
                      },{
                        $project: {
                          _id: 1,
                          name: 1,
                          address: 1,
                          salesPurchases: 1,
                          lastOrder: 1,
                          fullName: {
                            $concat: ['$name.first', ' ', '$name.last']
                          },
                        }
                      }, {
                        $project: {
                          _id: 1,
                          name: 1,
                          fullName: 1,
                          address: 1,
                          salesPurchases: 1,
                          lastOrder: 1,
                        }
                      },]).toArray((err, docs) => {
                        if (err) return pCb("err :  Secteur customers in a zone setGet" + err);
                        pCb(null, docs);
                      });
                  },
          }, (err, result) => {
                (err ? $.invalid(err) : $.success(result))
              });
          });
      });

      schema.setSave(function ($) {
          const DB = DATABASE(COLLECTION);
          let secteur = $.clean();
          DB.replaceOne({
              _id: secteur._id
          }, secteur, function (err, doc) {
              if (err)
                  return $.invalid(err);

              if (!doc.result.nModified)
                  return $.invalid('No modify');

              doc.result.notify = {
                  color: 'success',
                  text: 'Secteur mis à jour'
              }

              return $.success(doc.result);
          });
      });

      schema.addOperation("caSecteur",function($){
        const BillDB = DATABASE("Invoices");
        const paginationObject = MODULE('helper').page($.query);
        const skip = paginationObject.skip;
        const FilterMapper = MODULE('helper').filterMapper;
        var filterMapper = new FilterMapper();
        var filterObject = {};
        filterObject.$and = [];
        var filterSecteur = {};

        var filter = $.query.filter || {};

        if(filter.secteur){
          filterSecteur = filter.secteur;
          delete filter.secteur;
        }

        var contentType = $.query.contentType;
        if (filter && typeof filter === 'object') {
            filterObject.$and.push(filterMapper.mapFilter(filter, {
                contentType: contentType
            })); // caseFilter(filter);
        }

        var matchObject = {};
        var deplist = [];
        var re = [];

        if(filterSecteur.value.length > 0) re = filterSecteur.value[0].map( (r) => r.ObjectID());


        DATABASE(COLLECTION).find({
            _id : { $in :re}
          }).toArray(function(err, docs) {
                for (var i = 0; i < docs.length; i++)
                  for (var y = 0; y < docs[i].departement_fr.length; y++)
                    deplist.push( docs[i].departement_fr[y].numero.toString())

            var conditionZone = (deplist.length > 0) ? { "supplier.salesPurchases.zone" : {'$in': deplist} } : { "supplier.salesPurchases.zone": {$ne: null}};

          var queryCA = {
              salesPerson: {
                  $ne: null
              },
              Status: {
                  '$nin': ['DRAFT', 'CANCELED']
              },
              isremoved: {
                  $ne: true
              },
              datec: {
                  '$gte': moment().subtract(duringYear, 'year').startOf('year').toDate(),
                  '$lt': moment().endOf('day').toDate()
              },
              forSales: true
          };

          async.parallel([
              function (pCb) {
                  return pCb(null, [
                  {
                      $match: filterObject
                  },
                   {
                      $match: queryCA
                  },
                  {
                      $lookup: {
                        from: 'Customers',
              					localField: 'supplier',
              					foreignField: '_id',
              					as: 'supplier'
                      }
                  },{
                      $project: {
                          _id: 1,
                          total_ht: 1,
                          datec: 1,
                          salesPerson: 1,
                          lines: 1,
                          supplier: {
                    						$arrayElemAt: ['$supplier', 0]
                    			}
                      }
                  },{
                      $project: {
                          _id: 1,
                          total_ht: 1,
                          datec: 1,
                          salesPerson: 1,
                          lines: 1,
                          supplier: 1
                      }
                  },{
                    $match: conditionZone
                  },
                  {
                      $project: {
                          _id: 0,
                          total_ht: 1,
                          year: {
                              $year: "$datec"
                          },
                          month: {
                              $month: "$datec"
                          },
                          quarter: {
                              $cond: [{
                                  $lte: [{
                                      $month: "$datec"
                                  }, 3]
                              },
                                  "T1",
                              {
                                  $cond: [{
                                      $lte: [{
                                          $month: "$datec"
                                      }, 6]
                                  },
                                      "T2",
                                  {
                                      $cond: [{
                                          $lte: [{
                                              $month: "$datec"
                                          }, 9]
                                      },
                                          "T3",
                                          "T4"
                                      ]
                                  }
                                  ]
                              }
                              ]
                          },
                          salesPerson: 1,
                          lines: 1,
                      }
                  },
                  {
                      $match: (filter.month && filter.month.value.length && filter.month.value[1] ? (isNaN(filter.month.value[1]) ? {
                          "quarter": filter.month.value[1]
                      } : {
                              "month": parseInt(filter.month.value[1])
                          }) : {})
                  },
                  {
                      $match: matchObject
                  },
                 {
                      $group: {
                          _id: {
                              year: "$year"
                          },
                          total_ht: {
                              $sum: "$total_ht"
                          },
                          root: {
                              $push: '$$ROOT'
                          }
                      }
                  }, {
                      $unwind: '$root'
                  }, {
                      $group: {
                          _id: null,
                          totalAll: {
                              $addToSet: {
                                  year: {
                                      $toString: "$_id.year"
                                  },
                                  total_ht: "$total_ht"
                              }
                          },
                          root: {
                              $push: '$root'
                          }
                      }
                  },
                  {
                      $unwind: '$root'
                  }, {
                      $project: {
                          _id: '$root._id',
                          year: '$root.year',
                          total_ht: '$root.total_ht',
                          salesPerson: "$root.salesPerson",
                          lines: "$root.lines",
                          totalAll: 1
                      }
                  }
                  ]);

              },
              function (pCb) {
                  if (filter.detailBy && filter.detailBy.value && filter.detailBy.value == "byProduct")
                      // Group with detail of product
                      return pCb(null, [{
                          $unwind: '$lines'
                      }, {
                          $match: {
                              'lines.product': {
                                  $ne: null
                              }
                          }
                      }, {
                          $group: {
                              _id: {
                                  salesPerson: "$salesPerson",
                                  product: "$lines.product",
                                  year: "$year"
                              },
                              total_ht: {
                                  $sum: "$lines.total_ht"
                              },
                              qty: {
                                  $sum: "$lines.qty"
                              },
                              totalAll: {
                                  $first: "$totalAll"
                              }
                          }
                      }, {
                          $group: {
                              _id: {
                                  salesPerson: "$_id.salesPerson",
                                  product: "$_id.product"
                              },
                              yearly: {
                                  $addToSet: {
                                      year: {
                                          $toString: "$_id.year"
                                      },
                                      total_ht: "$total_ht",
                                      qty: "$qty"
                                  }
                              },
                              totalAll: {
                                  $first: "$totalAll"
                              }
                          }
                      }, {
                          $lookup: {
                              from: 'Product',
                              localField: '_id.product',
                              foreignField: '_id',
                              as: 'product'
                          }
                      },
                      {
                          $project: {
                              _id: 1,
                              yearly: 1,
                              year: 1,
                              totalAll: 1,
                              product: {
                                  $arrayElemAt: ['$product', 0]
                              }
                          }
                      }, {
                          $project: {
                              _id: {
                                  salesPerson: "$_id.salesPerson",
                                  product: {
                                      _id: "$_id.product",
                                      info: "$product.info"
                                  }
                              },
                              totalAll: 1,
                              yearly: {
                                  $arrayToObject: {
                                      $zip: {
                                          inputs: ["$yearly.year", "$yearly"]
                                      }
                                  }
                              }
                          }
                      }
                      ]);

                  //Only CA salesPerson
                  return pCb(null, [{
                      $group: {
                          _id: {
                              salesPerson: "$salesPerson",
                              year: "$year"
                          },
                          total_ht: {
                              $sum: "$total_ht"
                          },
                          totalAll: {
                              $first: "$totalAll"
                          }
                      }
                  }, {
                      $group: {
                          _id: {
                              salesPerson: "$_id.salesPerson"
                          },
                          yearly: {
                              $addToSet: {
                                  year: {
                                      $toString: "$_id.year"
                                  },
                                  total_ht: "$total_ht"
                              }
                          },
                          totalAll: {
                              $first: "$totalAll"
                          }
                      }
                  }, {
                      $project: {
                          _id: 1,
                          totalAll: 1,
                          yearly: {
                              $arrayToObject: {
                                  $zip: {
                                      inputs: ["$yearly.year", "$yearly"]
                                  }
                              }
                          }
                      }
                  }, {
                      $lookup: {
                          from: 'Employees',
                          localField: '_id.salesPerson',
                          foreignField: '_id',
                          as: 'salesPerson'
                      }
                  },
                  {
                      $project: {
                          _id: 1,
                          totalAll: 1,
                          yearly: 1,
                          salesPerson: {
                              $arrayElemAt: ['$salesPerson', 0]
                          }
                      }
                  },
                  {
                      $project: {
                          '_id.salesPerson': {
                              _id: '$salesPerson._id',
                              name: '$salesPerson.name',
                              fullName: {
                                  $concat: ['$salesPerson.name.last', ' ', '$salesPerson.name.first']
                              }
                          },
                          totalAll: 1,
                          yearly: 1,
                      }
                  }]);
              },
              function (pCb) {
                  return pCb(null, [{
                      $group: {
                          _id: null,
                          total: {
                              $sum: 1
                          },
                          root: {
                              $push: '$$ROOT'
                          }
                      }
                  },
                  {
                      $unwind: '$root'
                  },
                  {
                      $project: {
                          _id: '$root._id',
                          yearly: '$root.yearly',
                          total: 1,
                          totalAll: {
                              count: "$total",
                              yearly: {
                                  $arrayToObject: {
                                      $zip: {
                                          inputs: ["$root.totalAll.year", "$root.totalAll"]
                                      }
                                  }
                              }
                          }
                      }
                  },
                  {
                      $project: {
                          _id: 1,
                          yearly: 1,
                          total: 1,
                          totalAll: 1
                      }
                  },
                  {
                      $sort: {
                          "_id.salesPerson.fullName": 1,
                          "_id.product.info.SKU": 1
                      }
                  }
                  ]);
              }
          ], function (err, results) {

              let query = _.concat(results[0], results[1], results[2]);

              if ($.query.mode !== "export") {

                  if (skip)
                      query.push({
                          $skip: skip
                      });

                  // if (limit)
                  //     query.push({
                  //         $limit: limit
                  //     });
              }
              BillDB.aggregate(query).toArray(function (err, results) {
                  if (err)
                      return console.log(err);

                  for (let i = 0; i < results.length; i++) {
                      if (results[i].yearly["2018"] && results[i].yearly["2018"].total_ht && results[i].yearly["2019"] && results[i].yearly["2019"].total_ht)
                          results[i].yearly["2019"].gap = (results[i].yearly["2019"].total_ht - results[i].yearly["2018"].total_ht) / results[i].yearly["2018"].total_ht * 100;

                      if (results[i].yearly["2019"] && results[i].yearly["2019"].total_ht && results[i].yearly["2020"] && results[i].yearly["2020"].total_ht)
                          results[i].yearly["2020"].gap = (results[i].yearly["2020"].total_ht - results[i].yearly["2019"].total_ht) / results[i].yearly["2019"].total_ht * 100;

                  }

                  var count, firstElement, response = {};
                  firstElement = results[0];

                  let totalAll = firstElement && firstElement.totalAll ? firstElement.totalAll : {
                      count: 0,
                      yearly: {}
                  };

                  if (totalAll.yearly["2018"] && totalAll.yearly["2018"].total_ht && totalAll.yearly["2019"] && totalAll.yearly["2019"].total_ht)
                      totalAll.yearly["2019"].gap = (totalAll.yearly["2019"].total_ht - totalAll.yearly["2018"].total_ht) / totalAll.yearly["2018"].total_ht * 100;

                  if (totalAll.yearly["2019"] && totalAll.yearly["2019"].total_ht && totalAll.yearly["2020"] && totalAll.yearly["2020"].total_ht)
                      totalAll.yearly["2020"].gap = (totalAll.yearly["2020"].total_ht - totalAll.yearly["2019"].total_ht) / totalAll.yearly["2019"].total_ht * 100;



                  count = firstElement && firstElement.total ? firstElement.total : 0;
                  response.total = count;
                  response.totalAll = totalAll;

                  response.labels = ["2018", "2019", "2020"];
                  response.data = _.map(results, function (elem) {
                      return {
                          yearly: elem.yearly,
                          _id: elem._id
                      };
                  });
                  $.success(response);
              });
          });
        });
    });

});
