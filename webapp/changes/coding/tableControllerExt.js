sap.ui.define(
    [
        'sap/ui/core/mvc/ControllerExtension'
        // ,'sap/ui/core/mvc/OverrideExecution'
        , "sap/ndc/BarcodeScanner", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"
    ],
    function(
        ControllerExtension
        // ,OverrideExecution
        , BarcodeScanner, Filter, FilterOperator
    ) {
        'use strict';
        return ControllerExtension.extend("customer.custom.scm.ewm.physstocks1.tableControllerExt", {
            // metadata: {
            // 	// extension can declare the public methods
            // 	// in general methods that start with "_" are private
            // 	methods: {
            // 		publicMethod: {
            // 			public: true /*default*/ ,
            // 			final: false /*default*/ ,
            // 			overrideExecution: OverrideExecution.Instead /*default*/
            // 		},
            // 		finalPublicMethod: {
            // 			final: true
            // 		},
            // 		onMyHook: {
            // 			public: true /*default*/ ,
            // 			final: false /*default*/ ,
            // 			overrideExecution: OverrideExecution.After
            // 		},
            // 		couldBePrivate: {
            // 			public: false
            // 		}
            // 	}
            // },
            // // adding a private method, only accessible from this controller extension
            // _privateMethod: function() {},
            // // adding a public method, might be called from or overridden by other controller extensions as well
            // publicMethod: function() {},
            // // adding final public method, might be called from, but not overridden by other controller extensions as well
            // finalPublicMethod: function() {},
            // // adding a hook method, might be called by or overridden from other controller extensions
            // // override these method does not replace the implementation, but executes after the original method
            // onMyHook: function() {},
            // // method public per default, but made private via metadata
            // couldBePrivate: function() {},
            // // this section allows to extend lifecycle hooks or override public methods of the base controller
            override: {
                // 	/**
                // 	 * Called when a controller is instantiated and its View controls (if available) are already created.
                // 	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
                // 	 * @memberOf customer.custom.scm.ewm.physstocks1.tableControllerExt
                // 	 */
                onInit: function() {
                    sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts").setShowClearButton(true);
                    var that = this;
                    var oButton = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts-btnClear");
                    if (oButton) {
                        oButton.attachPress(this.onClearPress, this);
                    }
                    //                     sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts").addDelegate({
                    // onAfterRendering: function (oEvent) {

                    // }.bind(this)
                    // });

                    //                         const oField = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Product-inner");
                    //   if (oField) {
                    //     oField.attachValueHelpRequest(this.onProductValueHelp.bind(this));
                    //   }
                },
                // 	/**
                // 	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
                // 	 * (NOT before the first rendering! onInit() is used for that one!).
                // 	 * @memberOf customer.custom.scm.ewm.physstocks1.tableControllerExt
                // 	 */
                // 	onBeforeRendering: function() {
                // 	},
                // 	/**
                // 	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
                // 	 * This hook is the same one that SAPUI5 controls get after being rendered.
                // 	 * @memberOf customer.custom.scm.ewm.physstocks1.tableControllerExt
                // 	 */
                // 	onAfterRendering: function() {
                // 	},
                // 	/**
                // 	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
                // 	 * @memberOf customer.custom.scm.ewm.physstocks1.tableControllerExt
                // 	 */
                // 	onExit: function() {
                // 	},
                // 	// override public method of the base controller
                // 	basePublicMethod: function() {
                // 	}
                onBeforeRebindTableExtension: function(oSource) {

                }
            },
            onScanPress: function(oEvent) {
                var that = this;
                if (!sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts").getFilterConditions().EWMWarehouse) {
                    sap.m.MessageToast.show("Select warehouse before scanning any item");
                    return;
                }
                BarcodeScanner.scan(
                    function(oResult) {
                        if (!oResult.cancelled) {
                            // Identify field by prefix in scanned text
                            function getFieldByAppIdentifier(inputText) {
                                const appIdMap = {
                                    "240": "PROD",
                                    "00": "HU",
                                    "10": "BATCH"
                                };

                                // Match longest key prefix first
                                const sortedKeys = Object.keys(appIdMap).sort((a, b) => b.length - a.length);

                                for (const key of sortedKeys) {
                                    if (inputText.startsWith(key)) {
                                        return {
                                            field: appIdMap[key],
                                            value: inputText.slice(key.length) // text without the identifier
                                        };
                                    }
                                }

                                // No identifier found, consider it as SB
                                return {
                                    field: "SB",
                                    value: inputText
                                };
                            }

                            // Validation function (allows up to max length, but not exceeding)
                            function isValidFormat(field, value) {
                                switch (field) {
                                    case "PROD":
                                    case "HU":
                                        return /^\d{1,18}$/.test(value); // numeric, 1 to 18 digits
                                    case "BATCH":
                                        return /^[a-zA-Z0-9]{1,10}$/.test(value); // alphanumeric, 1 to 10 chars
                                    case "SB":
                                        return true; // No validation
                                    default:
                                        return false;
                                }
                            }

                            // Parse and validate scanned input
                            const parts = oResult.text.split('#');
                            const parsedResults = [];

                            for (const part of parts) {
                                const parsed = getFieldByAppIdentifier(part);
                                if (isValidFormat(parsed.field, parsed.value)) {
                                    var filterObj = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts").getFilterConditions(),
                                        oWarehouse = filterObj.EWMWarehouse[0].values[0];
                                    switch (parsed.field) {
                                        case "PROD":
                                            // var value = {
                                            //     operator: "EQ",
                                            //     validated: "validated",
                                            //     values: [parsed.value]
                                            // };
                                            // if (!filterObj.Product)
                                            //     filterObj.Product = [];
                                            // filterObj.Product.push(value);
                                            // var field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Product-inner"),
                                            //     oToken = new sap.m.Token({
                                            //         key: parsed.value,
                                            //         text: parsed.value
                                            //     });
                                            // field.addToken(oToken);
                                            var field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Product-inner");
                                            // 1. Prepare the model data structure
                                            var aConditions = field.getModel("$field")?.getProperty("/conditions") || [];

                                            aConditions.push({
                                                operator: "EQ", // example values — adjust based on your use case
                                                values: [parsed.value], // or parsed.key, etc.
                                                isEmpty: false,
                                                validated: "validated"
                                            });

                                            // 2. Set the updated data back to the model
                                            var oModel = field.getModel("$field");

                                            if (!oModel) {
                                                // Create model if it doesn't exist
                                                oModel = new sap.ui.model.json.JSONModel({
                                                    conditions: aConditions
                                                });
                                                field.setModel(oModel, "$field");
                                            } else {
                                                oModel.setProperty("/conditions", aConditions);
                                            }

                                            // 3. Get the context of the new condition (last pushed item)
                                            var iNewIndex = aConditions.length - 1;
                                            var oContext = oModel.getContext("/conditions/" + iNewIndex);

                                            // 4. Create the token
                                            var oToken = new sap.m.Token({
                                                text: parsed.value, // or use binding if needed: text: "{field>values/0}"
                                                editableParent: true,
                                                posinset: 1,
                                                setsize: 1
                                            });

                                            // 5. Attach context and model
                                            oToken.setBindingContext(oContext, "$field");
                                            oToken.setModel(oModel, "$field");

                                            // 6. Add token to the field
                                            field.addToken(oToken);

                                            break;
                                        case "HU":
                                            // var value = {
                                            //     operator: "EQ",
                                            //     payload: {
                                            //         "": [{
                                            //             EWWarehouse: oWarehouse,
                                            //             HandlingUnitNumber: parsed.value,
                                            //             HandlingUnitIndicator: ""
                                            //         }]
                                            //     },
                                            //     validated: "validated",
                                            //     values: [parsed.value]
                                            // };
                                            // if (!filterObj.HandlingUnitNumber)
                                            //     filterObj.HandlingUnitNumber = [];
                                            // filterObj.HandlingUnitNumber.push(value);
                                            // var field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::HandlingUnitNumber-inner"),
                                            //     oToken = new sap.m.Token({
                                            //         key: parsed.value,
                                            //         text: parsed.value
                                            //     });
                                            // field.addToken(oToken);
                                            var field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::HandlingUnitNumber-inner");
                                            // 1. Prepare the model data structure
                                            var aConditions = field.getModel("$field")?.getProperty("/conditions") || [];

                                            aConditions.push({
                                                  operator: "EQ",
                                                payload: {
                                                    "": [{
                                                        EWWarehouse: oWarehouse,
                                                        HandlingUnitNumber: parsed.value,
                                                        HandlingUnitIndicator: ""
                                                    }]
                                                },
                                                validated: "validated",
                                                values: [parsed.value]
                                            });

                                            // 2. Set the updated data back to the model
                                            var oModel = field.getModel("$field");

                                            if (!oModel) {
                                                // Create model if it doesn't exist
                                                oModel = new sap.ui.model.json.JSONModel({
                                                    conditions: aConditions
                                                });
                                                field.setModel(oModel, "$field");
                                            } else {
                                                oModel.setProperty("/conditions", aConditions);
                                            }

                                            // 3. Get the context of the new condition (last pushed item)
                                            var iNewIndex = aConditions.length - 1;
                                            var oContext = oModel.getContext("/conditions/" + iNewIndex);

                                            // 4. Create the token
                                            var oToken = new sap.m.Token({
                                                text: parsed.value, // or use binding if needed: text: "{field>values/0}"
                                                editableParent: true,
                                                posinset: 1,
                                                setsize: 1
                                            });

                                            // 5. Attach context and model
                                            oToken.setBindingContext(oContext, "$field");
                                            oToken.setModel(oModel, "$field");

                                            // 6. Add token to the field
                                            field.addToken(oToken);
                                            break;
                                        case "BATCH":
                                            // value = {
                                            //     operator: "EQ",
                                            //     payload: {
                                            //         "": [{
                                            //             EWWarehouse: oWarehouse,
                                            //             Batch: parsed.value,
                                            //             EntitledToDisposeParty: "",
                                            //             Product: ""
                                            //         }]
                                            //     },
                                            //     validated: "validated",
                                            //     values: [parsed.value]
                                            // };
                                            // if (!filterObj.Batch)
                                            //     filterObj.Batch = [];
                                            // filterObj.Batch.push(value);

                                            // field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Batch-inner"),
                                            //     oToken = new sap.m.Token({
                                            //         key: parsed.value,
                                            //         text: parsed.value
                                            //     });
                                            // if (field) {
                                            //     field.addToken(oToken);

                                            //     sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Batch").setVisible(true);
                                            // }
                                            field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Batch-inner");
                                            // 1. Prepare the model data structure
                                            var aConditions = field.getModel("$field")?.getProperty("/conditions") || [];

                                            aConditions.push({
                                                    operator: "EQ",
                                                payload: {
                                                    "": [{
                                                        EWWarehouse: oWarehouse,
                                                        Batch: parsed.value,
                                                        EntitledToDisposeParty: "",
                                                        Product: ""
                                                    }]
                                                },
                                                validated: "validated",
                                                values: [parsed.value]
                                            });

                                            // 2. Set the updated data back to the model
                                            var oModel = field.getModel("$field");

                                            if (!oModel) {
                                                // Create model if it doesn't exist
                                                oModel = new sap.ui.model.json.JSONModel({
                                                    conditions: aConditions
                                                });
                                                field.setModel(oModel, "$field");
                                            } else {
                                                oModel.setProperty("/conditions", aConditions);
                                            }

                                            // 3. Get the context of the new condition (last pushed item)
                                            var iNewIndex = aConditions.length - 1;
                                            var oContext = oModel.getContext("/conditions/" + iNewIndex);

                                            // 4. Create the token
                                            var oToken = new sap.m.Token({
                                                text: parsed.value, // or use binding if needed: text: "{field>values/0}"
                                                editableParent: true,
                                                posinset: 1,
                                                setsize: 1
                                            });

                                            // 5. Attach context and model
                                            oToken.setBindingContext(oContext, "$field");
                                            oToken.setModel(oModel, "$field");

                                            // 6. Add token to the field
                                            field.addToken(oToken);
                                            break;
                                        case "SB":
                                            // value = {
                                            //     operator: "EQ",
                                            //     payload: {
                                            //         "": [{
                                            //             EWWarehouse: oWarehouse,
                                            //             EWMStorageBin: parsed.value,
                                            //             EWMStorageType: ""
                                            //         }]
                                            //     },
                                            //     validated: "validated",
                                            //     values: [parsed.value]
                                            // };
                                            // if (!filterObj.EWMStorageBin)
                                            //     filterObj.EWMStorageBin = [];
                                            // filterObj.EWMStorageBin.push(value);
                                            // field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::EWMStorageBin-inner"),
                                            //     oToken = new sap.m.Token({
                                            //         key: parsed.value,
                                            //         text: parsed.value
                                            //     });
                                            // field.addToken(oToken);
                                            field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::EWMStorageBin-inner");
                                            // 1. Prepare the model data structure
                                            var aConditions = field.getModel("$field")?.getProperty("/conditions") || [];

                                            aConditions.push({
                                                     operator: "EQ",
                                                payload: {
                                                    "": [{
                                                        EWWarehouse: oWarehouse,
                                                        EWMStorageBin: parsed.value,
                                                        EWMStorageType: ""
                                                    }]
                                                },
                                                validated: "validated",
                                                values: [parsed.value]
                                            });

                                            // 2. Set the updated data back to the model
                                            var oModel = field.getModel("$field");

                                            if (!oModel) {
                                                // Create model if it doesn't exist
                                                oModel = new sap.ui.model.json.JSONModel({
                                                    conditions: aConditions
                                                });
                                                field.setModel(oModel, "$field");
                                            } else {
                                                oModel.setProperty("/conditions", aConditions);
                                            }

                                            // 3. Get the context of the new condition (last pushed item)
                                            var iNewIndex = aConditions.length - 1;
                                            var oContext = oModel.getContext("/conditions/" + iNewIndex);

                                            // 4. Create the token
                                            var oToken = new sap.m.Token({
                                                text: parsed.value, // or use binding if needed: text: "{field>values/0}"
                                                editableParent: true,
                                                posinset: 1,
                                                setsize: 1
                                            });

                                            // 5. Attach context and model
                                            oToken.setBindingContext(oContext, "$field");
                                            oToken.setModel(oModel, "$field");

                                            // 6. Add token to the field
                                            field.addToken(oToken);
                                            break;
                                        default:
                                            return false;
                                    }
                                    sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts-btnSearch").firePress();
                                } else {
                                    console.warn(`Invalid format for ${parsed.field}: ${parsed.value}`);
                                }
                            }
                        }
                    }.bind(this),
                    function(oError) {
                        // Handle errors
                        sap.m.MessageToast.show("Scan failed: " + oError);
                    }
                );
            },
            onClearPress: function() {
                var filterObj = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts").getFilterConditions();
                if (filterObj.Product)
                    filterObj.Product = [];
                var field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Product-inner");

                field.destroyTokens();


                if (filterObj.HandlingUnitNumber)
                    filterObj.HandlingUnitNumber = [];

                var field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::HandlingUnitNumber-inner");

                field.destroyTokens();

                if (filterObj.Batch)
                    filterObj.Batch = [];

                field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Batch-inner");
                if (field) {
                    field.destroyTokens();
                    sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::Batch").setVisible(true);
                }
                if (filterObj.EWMStorageBin)
                    filterObj.EWMStorageBin = [];
                field = sap.ui.getCore().byId("scm.ewm.physstocks1::WarehousePhysicalStockProductsList--fe::FilterBar::WarehousePhysicalStockProducts::FilterField::EWMStorageBin-inner");
                field.destroyTokens();
            },

            onProductValueHelp: function(oEvent) {
                // oEvent.getSource()._oSuggPopover.attachEventOnce(function(oEvent) {

                // })
                oEvent.getSource()._oSuggestionsTable.addEventDelegate({
                    onAfterRendering: function(oEvent) {

                    }
                })
            }

        });
    }
);