"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("@jest/globals");
var models_js_1 = require("../models.js");
var Shape_js_1 = require("../shapes/Shape.js");
var ShapeDecorators_js_1 = require("../utils/ShapeDecorators.js");
var package_js_1 = require("../package.js");
var storage_test_js_1 = require("./storage.test.js");
var QuadSet_js_1 = require("../collections/QuadSet.js");
var LinkedStorage_js_1 = require("../utils/LinkedStorage.js");
var react_1 = __importDefault(require("react"));
var react_2 = require("@testing-library/react");
var ShapeSet_js_1 = require("../collections/ShapeSet.js");
var Package_js_1 = require("../utils/Package.js");
var test_utils_1 = require("react-dom/test-utils");
var xsd_js_1 = require("../ontologies/xsd.js");
var TraceShape_js_1 = require("../utils/TraceShape.js");
var personClass = models_js_1.NamedNode.getOrCreate(models_js_1.NamedNode.TEMP_URI_BASE + 'Person');
var name = models_js_1.NamedNode.getOrCreate(models_js_1.NamedNode.TEMP_URI_BASE + 'name');
var bestFriend = models_js_1.NamedNode.getOrCreate(models_js_1.NamedNode.TEMP_URI_BASE + 'bestFriend');
var hobby = models_js_1.NamedNode.getOrCreate(models_js_1.NamedNode.TEMP_URI_BASE + 'hobby');
var hasFriend = models_js_1.NamedNode.getOrCreate(models_js_1.NamedNode.TEMP_URI_BASE + 'hasFriend');
var birthDate = models_js_1.NamedNode.getOrCreate(models_js_1.NamedNode.TEMP_URI_BASE + 'birthDate');
var pluralTestProp = models_js_1.NamedNode.getOrCreate(models_js_1.NamedNode.TEMP_URI_BASE + 'pluralTestProp');
//required for testing automatic data loading in linked components
var store = new storage_test_js_1.InMemoryStore();
LinkedStorage_js_1.LinkedStorage.setDefaultStore(store);
var Person = /** @class */ (function (_super) {
    __extends(Person, _super);
    function Person() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Person_1 = Person;
    Object.defineProperty(Person.prototype, "name", {
        get: function () {
            return this.getValue(name);
        },
        set: function (val) {
            this.overwrite(name, new models_js_1.Literal(val));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Person.prototype, "bestFriend", {
        get: function () {
            return this.getOneAs(bestFriend, Person_1);
        },
        set: function (val) {
            this.overwrite(bestFriend, val.namedNode);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Person.prototype, "hobby", {
        get: function () {
            return this.getValue(hobby);
        },
        set: function (val) {
            this.overwrite(hobby, new models_js_1.Literal(val));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Person.prototype, "friends", {
        get: function () {
            return this.getAllAs(hasFriend, Person_1);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Person.prototype, "pluralTestProp", {
        get: function () {
            return this.getAllAs(pluralTestProp, Person_1);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Person.prototype, "birthDate", {
        get: function () {
            return this.hasProperty(birthDate)
                ? toNativeDate(this.getOne(birthDate))
                : null;
        },
        set: function (nativeDate) {
            this.overwrite(birthDate, fromNativeDate(nativeDate));
        },
        enumerable: false,
        configurable: true
    });
    var Person_1;
    Person.targetClass = personClass;
    __decorate([
        (0, ShapeDecorators_js_1.literalProperty)({
            path: name,
            maxCount: 1,
        }),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], Person.prototype, "name", null);
    __decorate([
        (0, ShapeDecorators_js_1.objectProperty)({
            path: bestFriend,
            maxCount: 1,
        }),
        __metadata("design:type", Person),
        __metadata("design:paramtypes", [Person])
    ], Person.prototype, "bestFriend", null);
    __decorate([
        (0, ShapeDecorators_js_1.literalProperty)({
            path: hobby,
            maxCount: 1,
        }),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], Person.prototype, "hobby", null);
    __decorate([
        (0, ShapeDecorators_js_1.objectProperty)({
            path: hasFriend,
            shape: Person,
        }),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], Person.prototype, "friends", null);
    __decorate([
        (0, ShapeDecorators_js_1.objectProperty)({
            path: pluralTestProp,
            shape: Person,
        }),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], Person.prototype, "pluralTestProp", null);
    __decorate([
        (0, ShapeDecorators_js_1.literalProperty)({
            path: birthDate,
        }),
        __metadata("design:type", Date),
        __metadata("design:paramtypes", [Date])
    ], Person.prototype, "birthDate", null);
    Person = Person_1 = __decorate([
        package_js_1.linkedShape
    ], Person);
    return Person;
}(Shape_js_1.Shape));
function fromNativeDate(nativeDate) {
    if (!nativeDate)
        return null;
    var value = nativeDate.toISOString();
    return new models_js_1.Literal(value, xsd_js_1.xsd.date);
}
function toNativeDate(literal) {
    return literal
        ? new Date(literal instanceof TraceShape_js_1.TestNode ? null : literal.value)
        : null;
}
var p1 = Person.getFromURI(models_js_1.NamedNode.TEMP_URI_BASE + 'p1-semmy');
p1.name = 'Semmy';
p1.birthDate = new Date('1990-01-01');
var p2 = Person.getFromURI(models_js_1.NamedNode.TEMP_URI_BASE + 'p2-moa');
p2.name = 'Moa';
p2.hobby = 'Jogging';
var p3 = Person.getFromURI(models_js_1.NamedNode.TEMP_URI_BASE + 'p3-jinx');
p3.name = 'Jinx';
var p4 = Person.getFromURI(models_js_1.NamedNode.TEMP_URI_BASE + 'p4-quinn');
p4.name = 'Quinn';
p1.friends.add(p2);
p1.friends.add(p3);
p2.bestFriend = p3;
p2.friends.add(p3);
p2.friends.add(p4);
p1.pluralTestProp.add(p1);
p1.pluralTestProp.add(p2);
p1.pluralTestProp.add(p3);
p1.pluralTestProp.add(p4);
var quads = new QuadSet_js_1.QuadSet(p1.getAllQuads().concat(p2.getAllQuads(), p3.getAllQuads(), p4.getAllQuads()));
LinkedStorage_js_1.LinkedStorage.setQuadsLoaded(quads);
store.addMultiple(quads);
(0, globals_1.describe)('query tests', function () {
    (0, globals_1.test)('can select a literal property of all instances', function () { return __awaiter(void 0, void 0, void 0, function () {
        var names;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = p.name;
                        return res;
                    })];
                case 1:
                    names = _a.sent();
                    // let names = resolveLocal(x);
                    /**
                     * Expected result:
                     * [{
                     *   "id:"..."
                     *   "shape": a Person
                     *   "name:"Semmy"
                     * },{
                     *   "name":"Moa",
                     * },... ]
                     */
                    (0, globals_1.expect)(Array.isArray(names)).toBe(true);
                    (0, globals_1.expect)(names.length).toBe(4);
                    (0, globals_1.expect)(typeof names[0] === 'object').toBe(true);
                    (0, globals_1.expect)(names[0].hasOwnProperty('name')).toBe(true);
                    (0, globals_1.expect)(names[0].name).toBe('Semmy');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('can select an object property of all instances', function () { return __awaiter(void 0, void 0, void 0, function () {
        var personFriends, firstResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends;
                    })];
                case 1:
                    personFriends = _a.sent();
                    firstResult = personFriends[0];
                    (0, globals_1.expect)(Array.isArray(personFriends)).toBe(true);
                    (0, globals_1.expect)(personFriends.length).toBe(4);
                    (0, globals_1.expect)(typeof personFriends[0] === 'object').toBe(true);
                    (0, globals_1.expect)(firstResult.hasOwnProperty('id')).toBe(true);
                    (0, globals_1.expect)(firstResult.id).toBe(p1.uri);
                    (0, globals_1.expect)(firstResult.friends.length).toBe(2);
                    (0, globals_1.expect)(firstResult.friends[0].id).toBe(p2.uri);
                    (0, globals_1.expect)(firstResult.friends[1].id).toBe(p3.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('can select a date', function () { return __awaiter(void 0, void 0, void 0, function () {
        var birthDates, firstResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return [p.birthDate, p.name];
                    })];
                case 1:
                    birthDates = _a.sent();
                    firstResult = birthDates[0];
                    (0, globals_1.expect)(Array.isArray(birthDates)).toBe(true);
                    (0, globals_1.expect)(birthDates.length).toBe(4);
                    (0, globals_1.expect)(typeof firstResult.birthDate === 'object').toBe(true);
                    (0, globals_1.expect)(firstResult.birthDate.toString()).toBe(p1.birthDate.toString());
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('can select sub properties of a first property that returns a set', function () { return __awaiter(void 0, void 0, void 0, function () {
        var namesOfFriends, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        //  QueryString<QueryShapeSet<Person, Person, "friends">, "name">
                        //step 1) --> QResult<QueryShapeSet<Person, Person, "friends">, {name: string}>[][]
                        //step 2) --> QResult<Person, {friends: QResult<Person, {name: string}>}>[][]
                        //--> QResult<Person, {friends: QResult<Person, {name:string}>}>[]
                        //QueryString<QueryShapeSet<Person, Person, "friends">, "name">
                        //Source : QueryShapeSet<Person, Person, "friends">
                        //Property: "name"
                        // QueryShapeSet<Person, Person, "friends">
                        //  ShapeType : Person
                        //  Source: Person
                        //  Property: "friends
                        // in other words. Person.friends is a set of persons
                        //which needs to be converted to QResult<Person (Source), friends: is a QResult<Person (ShapeType),{name:string}> array
                        var res = p.friends.name;
                        return res;
                    })];
                case 1:
                    namesOfFriends = _a.sent();
                    first = namesOfFriends[0];
                    (0, globals_1.expect)(Array.isArray(namesOfFriends)).toBe(true);
                    (0, globals_1.expect)(namesOfFriends.length).toBe(4);
                    (0, globals_1.expect)(first.id).toBe(p1.uri);
                    (0, globals_1.expect)(first.friends.length).toBe(2);
                    (0, globals_1.expect)(first.friends[0].id).toBe(p2.uri);
                    (0, globals_1.expect)(first.friends[0].name).toBe('Moa');
                    (0, globals_1.expect)(first.friends[0]['hobby']).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('can select a nested set of shapes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var friendsOfFriends, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends.friends;
                    })];
                case 1:
                    friendsOfFriends = _a.sent();
                    (0, globals_1.expect)(Array.isArray(friendsOfFriends)).toBe(true);
                    first = friendsOfFriends[0];
                    (0, globals_1.expect)(friendsOfFriends.length).toBe(4);
                    (0, globals_1.expect)(first.friends.length).toBe(2);
                    //p1 (first) is friends with p2 and p3. And p2 (first.friends[0]) is friends with p3 and p4
                    (0, globals_1.expect)(first.friends[0].friends.some(function (f) { return f.id == p3.uri; })).toBe(true);
                    (0, globals_1.expect)(first.friends[0].friends.some(function (f) { return f.id == p4.uri; })).toBe(true);
                    (0, globals_1.expect)(first.friends[1].friends.length).toBe(0);
                    (0, globals_1.expect)(friendsOfFriends[3].friends.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('can select multiple property paths', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = [p.name, p.friends, p.bestFriend.name];
                        return res;
                    })];
                case 1:
                    result = _a.sent();
                    //expected result:
                    /**
                     * [
                     * {
                     * "id": "p1",
                     * "name": "Semmy",
                     * "friends": [{id: "p2"}, {id: "p3"}]
                     * },
                     * ...
                     * ]
                     */
                    (0, globals_1.expect)(Array.isArray(result)).toBe(true);
                    (0, globals_1.expect)(result.length).toBe(4);
                    first = result[0];
                    (0, globals_1.expect)(first.name).toBe('Semmy');
                    (0, globals_1.expect)(Array.isArray(first.friends)).toBe(true);
                    (0, globals_1.expect)(first.friends.length).toBe(2);
                    (0, globals_1.expect)(first.friends.some(function (f) { return f.id === p2.uri; })).toBe(true);
                    (0, globals_1.expect)(first.friends.some(function (f) { return f.id === p4.uri; })).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('can select property of single shape value', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, second;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        // QShape<Person, QShape<Person, null, "">, "bestFriend">
                        var r = p.bestFriend.name;
                        // let r3 = [p.bestFriend];
                        // let r2 = [p.friends.friends.name];
                        return r;
                    })];
                case 1:
                    result = _a.sent();
                    //expected result:
                    /**
                     * [
                     * {
                     * "id": "p1",
                     * "bestFriend": {
                     *   "id": "p3",
                     *   "name": "Jinx"
                     * }
                     * ...
                     * ]
                     */
                    (0, globals_1.expect)(Array.isArray(result)).toBe(true);
                    (0, globals_1.expect)(result.length).toBe(4);
                    second = result[1];
                    (0, globals_1.expect)(second.bestFriend.id).toBe(p3.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('can select 3 level deep nested paths', function () { return __awaiter(void 0, void 0, void 0, function () {
        var level3Friends;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends.friends.friends;
                    })];
                case 1:
                    level3Friends = _a.sent();
                    (0, globals_1.expect)(level3Friends.length).toBe(4);
                    (0, globals_1.expect)(level3Friends.every(function (p) {
                        //level 1 is p1 has p2,p3 and p2 has p3,p4
                        return p.friends.every(function (f) {
                            //level 2 is p2 has p3,p4
                            return f.friends.every(function (f2) {
                                //level 3 is empty, because p3,p4 have no friends
                                return f2.friends.length === 0;
                            });
                        });
                    })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    // ### WHERE TESTS
    (0, globals_1.test)('can use where() to filter a string in a set of Literals with equals', function () { return __awaiter(void 0, void 0, void 0, function () {
        var friendsCalledMoa, first, second;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends.where(function (f) { return f.name.equals('Moa'); });
                    })];
                case 1:
                    friendsCalledMoa = _a.sent();
                    first = friendsCalledMoa[0];
                    second = friendsCalledMoa[1];
                    (0, globals_1.expect)(Array.isArray(friendsCalledMoa)).toBe(true);
                    (0, globals_1.expect)(first.friends.length).toBe(1);
                    (0, globals_1.expect)(first.friends[0].id).toBe(p2.uri);
                    (0, globals_1.expect)(second.friends.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('where and', function () { return __awaiter(void 0, void 0, void 0, function () {
        var friendsCalledMoaThatJog, first, second;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends.where(function (f) {
                            return f.name.equals('Moa').and(f.hobby.equals('Jogging'));
                        });
                    })];
                case 1:
                    friendsCalledMoaThatJog = _a.sent();
                    first = friendsCalledMoaThatJog[0];
                    second = friendsCalledMoaThatJog[1];
                    (0, globals_1.expect)(Array.isArray(friendsCalledMoaThatJog)).toBe(true);
                    (0, globals_1.expect)(first.friends.length).toBe(1);
                    (0, globals_1.expect)(first.friends[0].id).toBe(p2.uri);
                    (0, globals_1.expect)(second.friends.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('where or', function () { return __awaiter(void 0, void 0, void 0, function () {
        var orFriends, first, second;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends.where(function (f) {
                            return f.name.equals('Jinx').or(f.hobby.equals('Jogging'));
                        });
                    })];
                case 1:
                    orFriends = _a.sent();
                    first = orFriends[0];
                    second = orFriends[1];
                    (0, globals_1.expect)(Array.isArray(orFriends)).toBe(true);
                    (0, globals_1.expect)(first.friends.length).toBe(2);
                    (0, globals_1.expect)(first.friends[0].id).toBe(p2.uri);
                    (0, globals_1.expect)(first.friends[1].id).toBe(p3.uri);
                    (0, globals_1.expect)(second.friends.length).toBe(1);
                    (0, globals_1.expect)(second.friends[0].id).toBe(p3.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('empty select with where ', function () { return __awaiter(void 0, void 0, void 0, function () {
        var filteredNoProps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select().where(function (p) {
                        return p.name.equals(p1.name);
                    })];
                case 1:
                    filteredNoProps = _a.sent();
                    (0, globals_1.expect)(Array.isArray(filteredNoProps)).toBe(true);
                    (0, globals_1.expect)(filteredNoProps.length).toBe(1);
                    (0, globals_1.expect)(filteredNoProps[0].id).toBe(p1.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('where and or and', function () { return __awaiter(void 0, void 0, void 0, function () {
        var persons, persons2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends.where(function (f) {
                            return f.name
                                .equals('Jinx')
                                .or(f.hobby.equals('Jogging'))
                                .and(f.name.equals('Moa'));
                        });
                    })];
                case 1:
                    persons = _a.sent();
                    return [4 /*yield*/, Person.select(function (p) {
                            return p.friends.where(function (f) {
                                return f.name
                                    .equals('Jinx')
                                    .or(f.hobby.equals('Jogging').and(f.name.equals('Moa')));
                            });
                        })];
                case 2:
                    persons2 = _a.sent();
                    [persons, persons2].forEach(function (result) {
                        (0, globals_1.expect)(Array.isArray(result)).toBe(true);
                        (0, globals_1.expect)(result[0].friends.length).toBe(2);
                        (0, globals_1.expect)(result[1].friends.length).toBe(1);
                        (0, globals_1.expect)(result[2].friends.length).toBe(0);
                        (0, globals_1.expect)(result[3].friends.length).toBe(0);
                        (0, globals_1.expect)(result[0].friends[0].id).toBe(p2.uri);
                        (0, globals_1.expect)(result[0].friends[1].id).toBe(p3.uri);
                        (0, globals_1.expect)(result[1].friends[0].id).toBe(p3.uri);
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('where some implicit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var peopleWithFriendsCalledMoa;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select().where(function (p) {
                        return p.friends.name.equals('Moa');
                    })];
                case 1:
                    peopleWithFriendsCalledMoa = _a.sent();
                    (0, globals_1.expect)(Array.isArray(peopleWithFriendsCalledMoa)).toBe(true);
                    (0, globals_1.expect)(peopleWithFriendsCalledMoa.length).toBe(1);
                    (0, globals_1.expect)(peopleWithFriendsCalledMoa[0].id).toBe(p1.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('where some explicit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var peopleWithFriendsCalledMoa;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select().where(function (p) {
                        return p.friends.some(function (f) {
                            return f.name.equals('Moa');
                        });
                    })];
                case 1:
                    peopleWithFriendsCalledMoa = _a.sent();
                    (0, globals_1.expect)(Array.isArray(peopleWithFriendsCalledMoa)).toBe(true);
                    (0, globals_1.expect)(peopleWithFriendsCalledMoa.length).toBe(1);
                    (0, globals_1.expect)(peopleWithFriendsCalledMoa[0].id).toBe(p1.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('where every', function () { return __awaiter(void 0, void 0, void 0, function () {
        var allFriendsCalledMoaOrJinx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select().where(function (p) {
                        return p.friends.every(function (f) {
                            return f.name.equals('Moa').or(f.name.equals('Jinx'));
                        });
                    })];
                case 1:
                    allFriendsCalledMoaOrJinx = _a.sent();
                    (0, globals_1.expect)(Array.isArray(allFriendsCalledMoaOrJinx)).toBe(true);
                    (0, globals_1.expect)(allFriendsCalledMoaOrJinx.length).toBe(1);
                    (0, globals_1.expect)(allFriendsCalledMoaOrJinx[0].id).toBe(p1.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('where sequences', function () { return __awaiter(void 0, void 0, void 0, function () {
        var friendCalledJinxAndNameIsSemmy, friendCalledJinxAndNameIsSemmy2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select().where(function (p) {
                        var res = p.friends
                            .some(function (f) {
                            return f.name.equals('Jinx');
                        })
                            .and(p.name.equals('Semmy'));
                        return res;
                    })];
                case 1:
                    friendCalledJinxAndNameIsSemmy = _a.sent();
                    (0, globals_1.expect)(Array.isArray(friendCalledJinxAndNameIsSemmy)).toBe(true);
                    (0, globals_1.expect)(friendCalledJinxAndNameIsSemmy.length).toBe(1);
                    (0, globals_1.expect)(friendCalledJinxAndNameIsSemmy[0].id).toBe(p1.uri);
                    return [4 /*yield*/, Person.select(function (p) {
                            var res = p.name.where(function (n) {
                                return n.equals('Semmy');
                            });
                            return res;
                        }).where(function (p) {
                            return p.friends.some(function (f) {
                                return f.name.equals('Jinx');
                            });
                        })];
                case 2:
                    friendCalledJinxAndNameIsSemmy2 = _a.sent();
                    //make sure type is undefined. Then make everything with single shapes work only with QResult
                    (0, globals_1.expect)(Array.isArray(friendCalledJinxAndNameIsSemmy2)).toBe(true);
                    (0, globals_1.expect)(friendCalledJinxAndNameIsSemmy2.length).toBe(2);
                    (0, globals_1.expect)(friendCalledJinxAndNameIsSemmy2[0].id).toBe(p1.uri);
                    (0, globals_1.expect)(friendCalledJinxAndNameIsSemmy2[1].id).toBe(p2.uri);
                    (0, globals_1.expect)(friendCalledJinxAndNameIsSemmy2[0].name).toBe('Semmy');
                    (0, globals_1.expect)(typeof friendCalledJinxAndNameIsSemmy2[1].name).toBe('undefined');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('outer where()', function () { return __awaiter(void 0, void 0, void 0, function () {
        var friendsOfP1, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.friends;
                    }).where(function (p) {
                        return p.name.equals(p1.name);
                    })];
                case 1:
                    friendsOfP1 = _a.sent();
                    first = friendsOfP1[0];
                    (0, globals_1.expect)(Array.isArray(friendsOfP1)).toBe(true);
                    (0, globals_1.expect)(friendsOfP1).toHaveLength(1);
                    (0, globals_1.expect)(first.id).toBe(p1.uri);
                    (0, globals_1.expect)(first.friends.length).toBe(2);
                    (0, globals_1.expect)(first.friends[0].id).toBe(p2.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    //#### COUNT TESTS ####
    (0, globals_1.test)('count a shapeset', function () { return __awaiter(void 0, void 0, void 0, function () {
        var numberOfFriends;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = p.friends.size();
                        return res;
                    })];
                case 1:
                    numberOfFriends = _a.sent();
                    //Note that when no argument is given to count, we expect the key to be the label of the
                    // last property before count. So that's "friends"
                    //expected result
                    /**
                     * [{
                     *   id: "p1",
                     *   friends: 2
                     * },{
                     *  id: "p2",
                     *  friends: 2
                     *  },...]
                     */
                    (0, globals_1.expect)(Array.isArray(numberOfFriends)).toBe(true);
                    (0, globals_1.expect)(numberOfFriends[0].friends).toBe(2);
                    (0, globals_1.expect)(numberOfFriends[1].friends).toBe(2);
                    (0, globals_1.expect)(numberOfFriends[2].friends).toBe(0);
                    (0, globals_1.expect)(numberOfFriends[3].friends).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('count a nested property', function () { return __awaiter(void 0, void 0, void 0, function () {
        var numberOfFriends;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = p.friends.friends.size();
                        return res;
                    })];
                case 1:
                    numberOfFriends = _a.sent();
                    //expected result
                    /**
                     * [{
                     *   id: "p1",
                     *   friends: [{
                     *     id: "p2",
                     *     friends: 2
                     *   },{
                     *     id: "p3",
                     *     friends: 0
                     *   }]
                     * },...]
                     */
                    (0, globals_1.expect)(Array.isArray(numberOfFriends)).toBe(true);
                    (0, globals_1.expect)(Array.isArray(numberOfFriends[0].friends)).toBe(true);
                    (0, globals_1.expect)(numberOfFriends[0].friends[0].friends).toBe(2);
                    (0, globals_1.expect)(numberOfFriends[0].friends[1].friends).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    // test('shape.count() with a countable argument', async () => {
    //   //count the number of friends that each person has
    //   //QResult<Person, {friends: number}>[]
    //   let numberOfFriends = await Person.select((p) => {
    //     let res = p.count(p.friends);
    //
    //     return res;
    //   });
    //   //expected result
    //   /**
    //    * [{
    //    *   id: "p1",
    //    *   count: 2
    //    * },{
    //    *   id: "p2",
    //    *   count: 2
    //    * },...]
    //    */
    //
    //   expect(Array.isArray(numberOfFriends)).toBe(true);
    //   expect(numberOfFriends[0].count).toBe(2);
    //   expect(numberOfFriends[1].count).toBe(2);
    //   expect(numberOfFriends[2].count).toBe(0);
    //   expect(numberOfFriends[3].count).toBe(0);
    // });
    (0, globals_1.test)('labeling the key of count()', function () { return __awaiter(void 0, void 0, void 0, function () {
        var numberOfFriends3, first, firstNumFriends;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = p.friends.select(function (f) { return ({ numFriends: f.friends.size() }); });
                        return res;
                    })];
                case 1:
                    numberOfFriends3 = _a.sent();
                    first = numberOfFriends3[0];
                    firstNumFriends = first.friends[0].numFriends;
                    (0, globals_1.expect)(first.hasOwnProperty('friends')).toBe(true);
                    (0, globals_1.expect)(first.hasOwnProperty('count')).toBe(false);
                    (0, globals_1.expect)(firstNumFriends).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    // test('count a nested path as argument', async () => {
    //   //count the number of second level friends that each person has
    //   //count is expected to count the total number of final nodes (friends) in the p.friends.friends set
    //   //by counting each sub result and combinging the results
    //   let numberOfFriends = await Person.select((p) => {
    //     let res = p.count(p.friends.friends, 'numFriends');
    //     return res;
    //   });
    //   //expected result
    //   /**
    //    * [{
    //    *   id: "p1",
    //    *   count: 2
    //    * },{
    //    *   id: "p2",
    //    *   count: 0
    //    * },...]
    //    */
    //
    //   let first = numberOfFriends[0];
    //   expect(Array.isArray(numberOfFriends)).toBe(true);
    //   expect(numberOfFriends[0].count).toBe(2);
    //   expect(numberOfFriends[1].count).toBe(0);
    //   expect(numberOfFriends[2].count).toBe(0);
    //   expect(numberOfFriends[3].count).toBe(0);
    // });
    (0, globals_1.test)('sub select custom', function () { return __awaiter(void 0, void 0, void 0, function () {
        var namesAndHobbiesOfFriends, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = p.friends.select(function (f) {
                            var res2 = {
                                _name: f.name,
                                _hobby: f.hobby,
                            };
                            return res2;
                        });
                        return res;
                    })];
                case 1:
                    namesAndHobbiesOfFriends = _a.sent();
                    first = namesAndHobbiesOfFriends[0];
                    (0, globals_1.expect)(Array.isArray(namesAndHobbiesOfFriends)).toBe(true);
                    (0, globals_1.expect)(namesAndHobbiesOfFriends.length).toBe(4);
                    (0, globals_1.expect)(first.friends.length).toBe(2);
                    (0, globals_1.expect)(first.friends[0]._name).toBe('Moa');
                    (0, globals_1.expect)(first.friends[0]._hobby).toBe('Jogging');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('custom result object - equals without where', function () { return __awaiter(void 0, void 0, void 0, function () {
        var customResult, first, second;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = {
                            nameIsMoa: p.name.equals('Moa'),
                            name: p.name,
                        };
                        return res;
                    })];
                case 1:
                    customResult = _a.sent();
                    first = customResult[0];
                    second = customResult[1];
                    (0, globals_1.expect)(Array.isArray(customResult)).toBe(true);
                    (0, globals_1.expect)(first.id).toBe(p1.uri);
                    (0, globals_1.expect)(first.nameIsMoa).toBe(false);
                    (0, globals_1.expect)(typeof first.name).toBe('string');
                    (0, globals_1.expect)(second.id).toBe(p2.uri);
                    (0, globals_1.expect)(second.nameIsMoa).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('custom result object 2', function () { return __awaiter(void 0, void 0, void 0, function () {
        var customResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res = {
                            nameIsMoa: p.name.equals('Moa'),
                            moaAsFriend: p.friends.some(function (f) { return f.name.equals('Moa'); }),
                            numFriends: p.friends.size(),
                            friendsOfFriends: p.friends.friends,
                            //
                        };
                        return res;
                    })];
                case 1:
                    customResult = _a.sent();
                    (0, globals_1.expect)(Array.isArray(customResult)).toBe(true);
                    (0, globals_1.expect)(customResult[0].id).toBe(p1.uri);
                    (0, globals_1.expect)(customResult[0].nameIsMoa).toBe(false);
                    (0, globals_1.expect)(customResult[1].id).toBe(p2.uri);
                    (0, globals_1.expect)(customResult[1].nameIsMoa).toBe(true);
                    (0, globals_1.expect)(customResult[0].moaAsFriend).toBe(true);
                    (0, globals_1.expect)(customResult[1].moaAsFriend).toBe(false);
                    (0, globals_1.expect)(Array.isArray(customResult[0].friendsOfFriends)).toBe(true);
                    (0, globals_1.expect)(Array.isArray(customResult[0].friendsOfFriends[0].friends)).toBe(true);
                    (0, globals_1.expect)(customResult[0].friendsOfFriends[0].id).toBe(p2.uri);
                    (0, globals_1.expect)(customResult[0].friendsOfFriends[0].friends[0].id).toBe(p3.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('count equals', function () { return __awaiter(void 0, void 0, void 0, function () {
        var numberOfFriends;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select().where(function (p) {
                        var res = p.friends.size().equals(2);
                        return res;
                    })];
                case 1:
                    numberOfFriends = _a.sent();
                    (0, globals_1.expect)(Array.isArray(numberOfFriends)).toBe(true);
                    (0, globals_1.expect)(numberOfFriends.length).toBe(2);
                    (0, globals_1.expect)(numberOfFriends[0].id).toBe(p1.uri);
                    (0, globals_1.expect)(numberOfFriends[1].id).toBe(p2.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('sub select query returning an array', function () { return __awaiter(void 0, void 0, void 0, function () {
        var subResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        var res1 = p.friends.select(function (f) {
                            var res2 = [f.name, f.hobby];
                            return res2;
                        });
                        return res1;
                    })];
                case 1:
                    subResult = _a.sent();
                    subResult.forEach(function (person) {
                        person.friends.forEach(function (friend) {
                            var name = friend.name, hobby = friend.hobby;
                            (0, globals_1.expect)(typeof name).toBe('string');
                            (0, globals_1.expect)(typeof hobby === 'string' || typeof hobby === 'undefined').toBe(true);
                        });
                    });
                    (0, globals_1.expect)(Array.isArray(subResult)).toBe(true);
                    (0, globals_1.expect)(subResult.length).toBe(4);
                    (0, globals_1.expect)(subResult[0].friends[0].hasOwnProperty('name')).toBe(true);
                    (0, globals_1.expect)(subResult[0].friends[0].hasOwnProperty('hobby')).toBe(true);
                    (0, globals_1.expect)(subResult[0].friends[0].name).toBe('Moa');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('component with single property query', function () { return __awaiter(void 0, void 0, void 0, function () {
        var Component, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Component = (0, package_js_1.linkedComponent)(Person.query(function (p) { return p.name; }), function (_a) {
                        var name = _a.name;
                        return react_1.default.createElement("div", null, name);
                    });
                    component = (0, react_2.render)(react_1.default.createElement(Component, { of: p1 }));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () { return (0, globals_1.expect)(component.getByText('Semmy')).toBeTruthy(); }, {
                            timeout: 5000,
                            interval: 50,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('component with where query', function () { return __awaiter(void 0, void 0, void 0, function () {
        var query, query1Result, query2Result, Component2, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = Person.query(function (p) { return p.friends.where(function (f) { return f.name.equals('Jinx'); }).name; });
                    return [4 /*yield*/, query.exec()];
                case 1:
                    query1Result = _a.sent();
                    return [4 /*yield*/, Person.select(function (p) { return p.friends.where(function (f) { return f.name.equals('Jinx'); }).name; })];
                case 2:
                    query2Result = _a.sent();
                    Component2 = (0, package_js_1.linkedComponent)(query, function (_a) {
                        var friends = _a.friends, shape = _a.shape, id = _a.id, source = _a.source;
                        // unknown extends LinkedQuery<any, infer Response, infer Source> ? GetNestedQueryResultType<Response, Source, null> : (unknown extends Array<infer Type> ? UnionToIntersection<QueryResponseToResultType<Type>> : (unknown extends Evaluation ? boolean : (unknown extends Object ? QResult<null, ObjectToPlainResult<unknown>> : unknown)))
                        var s = source;
                        var f = friends;
                        var shp = shape;
                        var i = id;
                        return react_1.default.createElement("div", null, friends[0].name);
                    });
                    component = (0, react_2.render)(react_1.default.createElement(Component2, { of: p1 }));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () { return (0, globals_1.expect)(component.getByText('Jinx')).toBeTruthy(); })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('component with custom props', function () { return __awaiter(void 0, void 0, void 0, function () {
        var query, ComponentWithCustomProps, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = Person.query(function (p) { return p.friends.where(function (f) { return f.name.equals('Jinx'); }).name; });
                    ComponentWithCustomProps = (0, package_js_1.linkedComponent)(query, function (_a) {
                        var friends = _a.friends, shape = _a.shape, id = _a.id, custom1 = _a.custom1, source = _a.source;
                        // unknown extends LinkedQuery<any, infer Response, infer Source> ? GetNestedQueryResultType<Response, Source, null> : (unknown extends Array<infer Type> ? UnionToIntersection<QueryResponseToResultType<Type>> : (unknown extends Evaluation ? boolean : (unknown extends Object ? QResult<null, ObjectToPlainResult<unknown>> : unknown)))
                        friends.length;
                        friends[0].name;
                        friends[0].id;
                        return (react_1.default.createElement("div", null,
                            react_1.default.createElement("span", null, friends[0].name),
                            react_1.default.createElement("span", null, custom1.toString())));
                    });
                    component = (0, react_2.render)(react_1.default.createElement(ComponentWithCustomProps, { of: p1, custom1: true }));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () { return (0, globals_1.expect)(component.getByText('Jinx')).toBeTruthy(); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, react_2.waitFor)(function () { return (0, globals_1.expect)(component.getByText('true')).toBeTruthy(); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('component requesting data from child components', function () { return __awaiter(void 0, void 0, void 0, function () {
        var query1, Component1, query2, query2Object, Component2, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query1 = Person.query(function (p) { return p.name; });
                    Component1 = (0, package_js_1.linkedComponent)(query1, function (_a) {
                        var name = _a.name;
                        return react_1.default.createElement("span", null, name);
                    });
                    query2 = Person.query(function (p) {
                        // let res = [p.hobby, p.bestFriend.preloadFor(Component1)];
                        // let res = [p.hobby, Component1.of(p.bestFriend)];
                        //This would also work
                        var res = {
                            hobby: p.hobby,
                            bestFriend: p.bestFriend,
                        };
                        return res;
                    });
                    query2Object = query2.getQueryPaths();
                    Component2 = (0, package_js_1.linkedComponent)(query2, function (_a) {
                        var hobby = _a.hobby, bestFriend = _a.bestFriend;
                        return (react_1.default.createElement(react_1.default.Fragment, null,
                            react_1.default.createElement("span", null, hobby),
                            react_1.default.createElement(Component1, { of: bestFriend })));
                    });
                    component = (0, react_2.render)(react_1.default.createElement(Component2, { of: p2, customasd1: true }));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () { return (0, globals_1.expect)(component.getByText('Jinx')).toBeTruthy(); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, react_2.waitFor)(function () { return (0, globals_1.expect)(component.getByText('Jogging')).toBeTruthy(); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('linked set components', function () { return __awaiter(void 0, void 0, void 0, function () {
        var NameList, persons, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    NameList = (0, package_js_1.linkedSetComponent)(Person.query(function (person) { return [person.name, person.hobby]; }), function (_a) {
                        var sources = _a.sources, linkedData = _a.linkedData;
                        var persons = linkedData;
                        return (react_1.default.createElement("ul", null, persons.map(function (person) {
                            return (react_1.default.createElement("li", { key: person.id },
                                react_1.default.createElement("span", null, person.name),
                                react_1.default.createElement("span", null, person.hobby)));
                        })));
                    });
                    persons = new ShapeSet_js_1.ShapeSet([p1, p2, p3, p4]);
                    component = (0, react_2.render)(react_1.default.createElement(NameList, { of: persons }));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () {
                            persons.forEach(function (person) {
                                (0, globals_1.expect)(component.getByText(person.name)).toBeTruthy();
                            });
                            (0, globals_1.expect)(component.getByText(p2.hobby)).toBeTruthy();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('linked set components without source', function () { return __awaiter(void 0, void 0, void 0, function () {
        var NameList, persons, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    NameList = (0, package_js_1.linkedSetComponent)(Person.query(function (person) { return [person.name, person.hobby]; }), function (_a) {
                        var sources = _a.sources, linkedData = _a.linkedData;
                        var persons = linkedData;
                        return (react_1.default.createElement("ul", null, persons.map(function (person) {
                            return (react_1.default.createElement("li", { key: person.id },
                                react_1.default.createElement("span", null, person.name),
                                react_1.default.createElement("span", null, person.hobby)));
                        })));
                    });
                    persons = new ShapeSet_js_1.ShapeSet([p1, p2, p3, p4]);
                    component = (0, react_2.render)(react_1.default.createElement(NameList, null));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () {
                            persons.forEach(function (person) {
                                (0, globals_1.expect)(component.getByText(person.name)).toBeTruthy();
                            });
                            (0, globals_1.expect)(component.getByText(p2.hobby)).toBeTruthy();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('linked set components with named data prop', function () { return __awaiter(void 0, void 0, void 0, function () {
        var query, NameList, persons, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = Person.query(function (person) { return [person.name, person.hobby]; });
                    NameList = (0, package_js_1.linkedSetComponent)({ persons: query }, function (_a) {
                        var persons = _a.persons;
                        return (react_1.default.createElement("ul", null, persons.map(function (person) {
                            return (react_1.default.createElement("li", { key: person.id },
                                react_1.default.createElement("span", null, person.name),
                                react_1.default.createElement("span", null, person.hobby)));
                        })));
                    });
                    persons = new ShapeSet_js_1.ShapeSet([p1, p2, p3, p4]);
                    component = (0, react_2.render)(react_1.default.createElement(NameList, null));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () {
                            persons.forEach(function (person) {
                                (0, globals_1.expect)(component.getByText(person.name)).toBeTruthy();
                            });
                            (0, globals_1.expect)(component.getByText(p2.hobby)).toBeTruthy();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('linked set components rendered by linked component', function () { return __awaiter(void 0, void 0, void 0, function () {
        var query, NameList, PersonFriends, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = Person.query(function (person) { return [person.name, person.hobby]; });
                    NameList = (0, package_js_1.linkedSetComponent)({ persons: query }, function (_a) {
                        var persons = _a.persons;
                        return (react_1.default.createElement("ul", null, persons.map(function (person) {
                            return (react_1.default.createElement("li", { key: person.id },
                                react_1.default.createElement("span", null, person.name),
                                react_1.default.createElement("span", null, person.hobby)));
                        })));
                    });
                    PersonFriends = (0, package_js_1.linkedComponent)(Person.query(function (p) {
                        return [p.name, p.friends.preloadFor(NameList)];
                    }), function (_a) {
                        var name = _a.name, friends = _a.friends;
                        return (react_1.default.createElement("div", null,
                            react_1.default.createElement("span", null, name),
                            react_1.default.createElement(NameList, { of: friends })));
                    });
                    component = (0, react_2.render)(react_1.default.createElement(PersonFriends, { of: p1 }));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () {
                            (0, globals_1.expect)(component.getByText(p1.name)).toBeTruthy();
                            (0, globals_1.expect)(component.getByText(p2.name)).toBeTruthy();
                            (0, globals_1.expect)(component.getByText(p2.hobby)).toBeTruthy();
                            (0, globals_1.expect)(component.getByText(p3.name)).toBeTruthy();
                            // expect(component.getByText(p4.name)).toBeFalsy();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('linked set component with limit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var NameList, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, Package_js_1.setDefaultPageLimit)(2);
                    NameList = (0, package_js_1.linkedSetComponent)(Person.query(function (person) { return [person.name, person.hobby]; }), function (_a) {
                        var linkedData = _a.linkedData;
                        var persons = linkedData;
                        return (react_1.default.createElement("ul", null, persons.map(function (person) {
                            return (react_1.default.createElement("li", { key: person.id },
                                react_1.default.createElement("span", { role: "name" }, person.name)));
                        })));
                    });
                    component = (0, react_2.render)(react_1.default.createElement(NameList, null));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () {
                            (0, globals_1.expect)(component.getAllByRole('name').length).toBe(2);
                            (0, globals_1.expect)(component.getByText(p1.name)).toBeTruthy();
                            (0, globals_1.expect)(component.getByText(p2.name)).toBeTruthy();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('outer where with limit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var limitedNames, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.select(function (p) {
                        return p.name;
                    })
                        .where(function (p) {
                        return p.name.equals(p1.name).or(p.name.equals(p2.name));
                    })
                        .limit(1)];
                case 1:
                    limitedNames = _a.sent();
                    first = limitedNames[0];
                    (0, globals_1.expect)(Array.isArray(limitedNames)).toBe(true);
                    (0, globals_1.expect)(limitedNames).toHaveLength(1);
                    (0, globals_1.expect)(first.id).toBe(p1.uri);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, globals_1.test)('linked set component with pagination - going to next page', function () { return __awaiter(void 0, void 0, void 0, function () {
        var NameList, component;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, Package_js_1.setDefaultPageLimit)(2);
                    NameList = (0, package_js_1.linkedSetComponent)({ persons: Person.query(function (person) { return [person.name, person.hobby]; }) }, function (_a) {
                        var persons = _a.persons, query = _a.query;
                        return (react_1.default.createElement("div", null,
                            react_1.default.createElement("ul", null, persons.map(function (person) {
                                return (react_1.default.createElement("li", { key: person.id },
                                    react_1.default.createElement("span", { role: "name" }, person.name)));
                            })),
                            react_1.default.createElement("button", { role: "next-page", onClick: function () {
                                    query.nextPage();
                                } }, "Next page")));
                    });
                    component = (0, react_2.render)(react_1.default.createElement(NameList, null));
                    return [4 /*yield*/, (0, react_2.waitFor)(function () {
                            (0, globals_1.expect)(component.getAllByRole('name').length).toBe(2);
                            (0, globals_1.expect)(component.getByText(p1.name)).toBeTruthy();
                            (0, globals_1.expect)(component.getByText(p2.name)).toBeTruthy();
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var button;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, component.findByRole('next-page')];
                                    case 1:
                                        button = _a.sent();
                                        button.click();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, react_2.waitFor)(function () {
                            (0, globals_1.expect)(component.getAllByRole('name').length).toBe(2);
                            (0, globals_1.expect)(component.getByText(p3.name)).toBeTruthy();
                            (0, globals_1.expect)(component.getByText(p4.name)).toBeTruthy();
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, globals_1.test)('linked set components with pagination with sources from other linked component', function () { return __awaiter(void 0, void 0, void 0, function () {
    var req, NameList, PersonFriends, component;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, Package_js_1.setDefaultPageLimit)(2);
                req = Person.query(function (person) { return person.name; });
                NameList = (0, package_js_1.linkedSetComponent)({ persons: req }, function (_a) {
                    var persons = _a.persons, query = _a.query;
                    return (react_1.default.createElement("div", null,
                        react_1.default.createElement("ul", null, persons.map(function (person) {
                            return (react_1.default.createElement("li", { key: person.id },
                                react_1.default.createElement("span", { role: 'name' }, person.name)));
                        })),
                        react_1.default.createElement("button", { role: "next-page", onClick: function () {
                                query.nextPage();
                            } }, "Next page")));
                });
                PersonFriends = (0, package_js_1.linkedComponent)(Person.query(function (p) {
                    return [p.pluralTestProp.preloadFor(NameList)];
                }), function (_a) {
                    var pluralTestProp = _a.pluralTestProp;
                    return (react_1.default.createElement("div", null,
                        react_1.default.createElement(NameList, { of: pluralTestProp })));
                });
                component = (0, react_2.render)(react_1.default.createElement(PersonFriends, { of: p1 }));
                return [4 /*yield*/, (0, react_2.waitFor)(function () {
                        (0, globals_1.expect)(component.getAllByRole('name')).toHaveLength(2);
                        (0, globals_1.expect)(component.getByText(p1.name)).toBeTruthy();
                        (0, globals_1.expect)(component.getByText(p2.name)).toBeTruthy();
                    })];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, test_utils_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var button;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, component.findByRole('next-page')];
                                case 1:
                                    button = _a.sent();
                                    button.click();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 2:
                _a.sent();
                return [4 /*yield*/, (0, react_2.waitFor)(function () {
                        (0, globals_1.expect)(component.getAllByRole('name')).toHaveLength(2);
                        (0, globals_1.expect)(component.getByText(p3.name)).toBeTruthy();
                        (0, globals_1.expect)(component.getByText(p4.name)).toBeTruthy();
                    })];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
//});
//NEXT:
//bring back flat
//Refactor duplicate value in "every"
//Refactor firstPath into an array
//FLAT: old, but keep
// // test('can select sub properties of a first property that returns a set - FLAT result', () => {
// //   let q = Person.select((p) => {
// //     return p.friends.name;
// //   });
// //   let namesOfFriends = resolveLocalFlat(q);
// //   expect(Array.isArray(namesOfFriends)).toBe(true);
// //   expect(namesOfFriends.length).toBe(3);
// //   expect(namesOfFriends.includes('Jinx')).toBe(true);
// //   expect(namesOfFriends.includes('Semmy')).toBe(false);
// // });
//OLD syntax, no longer supported because what would we return? too vague
// test('some without where', async () => {
//   let booleansResult = await Person.select((p) => {
//     return p.friends.some((f) => f.name.equals('Moa'));
//   });
//   expect(Array.isArray(booleansResult)).toBe(true);
//   expect(booleansResult.every((b) => typeof b === 'boolean')).toBe(true);
//   //1 person (person1) has a friend called Moa, so there is only one 'true' value
//   expect(booleansResult[0]).toBe(true);
//   // expect(booleansResult.filter((b) => b === true).length).toBe(1);
// });
// });
//a view that shows each person of a set as a avatar + name, with pagination or something
/**
 * View 1: PersonOverview, shows the name of person + its friends as PersonAvatar
 * View 2: PersonAvatar, shows name + avatar.source
 * The combined query
 */
// let res = Person.select((p) => [
//   p.friends.select((f) => [f.name, f.avatar]),
// ]).local();
//the result should be an array for the people returned
//each entry being 1 person
//so that we can still select the name of the friends of THAT specific person
//Even if we just get the friends names,
// Person.select((p) => p.friends.name);
//we'd still want to know who is who's friend
//So we can see if the result is always a bunch of quads, for each connection, not just the end result.
//But that can also be a graphQL like response, like arrays & objects with plain strings & numbers
//(we don't really need to know all the IDs of each person unless asked for example, or we always insert the ID?)
//In similar fashion, much like Fluree, we can also return json-ld-like(?) things? review that
//Conclusion, resolve to full data paths (JSONLD) and then locally rebuild into arrays of shapes
//or.. shapesets..
//who needs the properties if they're just available? :/
//which one is it?!
//if view 1 above resolves to a shapeset of persons (the root request), then we can trust that for those persons
//their name and friends are loaded
//so it doesn't matter what the end result is?
//if we select a bunch of names...
// let q = Person.select((p) => [
//   p.friends.name,
//   p.avatar.source,
//   p.friends.where((f) => f.name.equals('x')),
// ]);
//dont we want straight access to those things? Yes we do...
//what would this example look like? :
// [
//   ['name', 'http://image1.jpg', ShapeSet<Person>],
//   ['name2', 'http://image2.jpg', ShapeSet<Person>],
// ];
//BUT, I guess both should be possible.
// let {
//   sources,
//   results,
// }: {
//   sources: ShapeSet<Person>;
//   results: [string[], string, ShapeSet<Person>];
// } = q.local() as any;
//sources being the shapes selected
//results being the end results of the query / end points reached by the query
//getResults() / getSources()
//so the query:
//1) the remote store returns all the requested paths as JSON-LD
//2) LINCD rebuilds that in the graph, and makes shapes & result objects out of it.
//to isolate there is:
// q.loadOnly();
// q.resultsOnly();
//the issue is with multiple chained things in one:
//Not: Person.select(p => [p.name,pfriends]);
//BUT: Person.select(p => p.friends,recentLocations.name);
//Do we really want this?
// [
//   //persons
//   [
//     //friends of person1
//     [
//       //locations of friend1
//       'den haag',
//       'wateringen',
//     ],
//     [
//       //locations of friend2
//       'ubud',
//       'denpasar',
//     ],
//   ],
//   [
//     //friends of person2
//     [
//       //locations of friend1
//       'aljezur',
//     ],
//   ],
// ];
// OR is this what we want?
// ['den haag', 'wateringen', 'ubud', 'denpasar', 'aljezur'];
//remember, we will already have access to this:
// let q;
// q.load().then((ppl: ShapeSet<Person>) => {
//   ppl.forEach((person) => {
//     person.friends.forEach((friend) => {
//       friend.homeLocations.forEach((location) => {
//         console.log(location.name);
//       });
//     });
//   });
// });
// //whilst with the array in array result we could do this (very similar)
// q.results().then((ppl: string[][][]) => {
//   ppl.forEach((friend) => {
//     friend.forEach((location) => {
//       location.forEach((name) => {
//         console.log(name);
//       });
//     });
//   });
// });
//combined?
//Person.select(p => [
// p.friends.homelocations.name,
// p.name
//]);
//returns a combined horizontal array
//but separate vertical array
//but that also means the homelocation results are now split per person
//whilst before they were not!
// [['ubud', 'wateringen', 'etc'], 'Mike'];
//perhaps .flatResults() will be an option at a later point. Which will look like the above.
//show the homelocations of my friends on a map
//Map of me.friends.homelocations .. it will show each friends home location on the map, and of course it
//would be nice to show the name of the person!
//Or Names of the parents of my friends
//me.friends.parents.name
//again, we'd show all the info/all the connections
//BUT, like this?
//Grid of me.friends as [
//  UL of [
//    H3 of name,
//    [
//      UL of parents as [
//        H4 of name
//      ]
//    ]
//  ]
//]
//So we have a query.. we get paths. We take each element of a path and use a chain of containers to show them
//Grid -> Vertical Stack, Unsorted List
//all text as P
//then customise.
//put grids in cards.
//auto add things like names/labels? in the top of the card
//can also visualise as a tree
//SO.. conclusion is.. Paths are nice. autotranslating to views is nice.
//But we already have paths.
//We can keep it more simple for now by flattening horizontal paths
//its less like graph-QL, but easier to implement with auto complete
//and we already have shape results for graphQL like experience
//# sourceMappingURL=query.test.js.map