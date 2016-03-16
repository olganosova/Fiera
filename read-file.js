// ignore linting for this file
/* jshint ignore:start */
/**
 * Created by NOSOVO2 on 2/16/2016.
 */

(function () {
    'use strict';

    function ReadFileCtrl($scope, $filter, $location, $anchorScroll, $sce) {

        $scope.textLines = [];
        $scope.sourceJSON = [];
        $scope.masterJSON = [];

        $scope.currentGroup = "";
        $scope.groups = [];

        $scope.source = [];
        $scope.joined = [];
        $scope.toSave = [];
        $scope.lastlines = [];

        $scope.errorMessage = "";
        $scope.isShow = false;
        $scope.step = 0;
        $scope.progress = true;

        $scope.allCameras = [];
        $scope.missingMaster = [];
        $scope.descrMaster = [];
        $scope.missingCamOut = "";
        $scope.missingCamLocal = "";

        var textFile = null;


        $scope.loadFile = function ($fileContent) {
            var content = $fileContent;


            $scope.source.push(content);
            if ($scope.source.length === 2) {  //2 source files are loaded
                $scope.errorMessage = "";
                $scope.sourceJSON = [];
                $scope.masterJSON = [];
                $scope.missingMaster = [];
                $scope.descrMaster = [];
                var inner1 = $scope.parseFile($scope.source[0]); //master
                var inner2 = $scope.parseFile($scope.source[1]); //local

                $scope.processs2Files(inner1, inner2, "out", true);
                $scope.processs2Files(inner2, inner1, "local", false);
                $scope.sourceJSON = angular.copy($scope.masterJSON);
                $scope.descrMaster = angular.copy($scope.compareDesc($scope.sourceJSON));

            }
            if ($scope.source.length === 3) {

                $scope.missingCamOut = "Missing cameras in Fieraout: ";

                $scope.joined = angular.copy($scope.masterJSON);
                $scope.masterJSON = [];
                var joined = $scope.joined;//source
                var fieraout = $scope.parseFile($scope.source[2]); //fiera out
                $scope.processs2Files(fieraout, joined, "fieraout", true);
                $scope.processs2Files(joined, fieraout, "source", false);
                $scope.isShow = true;
                $scope.progress = false;

            }


        };

        $scope.processs2Files = function (first, second, lbl, errorOnly) {
            var inner1 = first; //master
            var inner2 = second; //local

            for (var ix = 0; ix < inner2.length; ix++) {
                var lineObj = inner2[ix];
                var found = ($filter('filter')(inner1, {camNum: inner2[ix].camNum}, true))[0];
                if (found) {
                    if (!errorOnly) {
                        lineObj.desc2 = found.desc;
                        lineObj.dns2 = found.dns;

                        lineObj.desc3 = found.desc2;
                        lineObj.dns3 = found.dns2;
                    }
                }
                else {
                    if (!isNaN(inner2[ix].camNum) || inner2[ix].camNum.substring(0, 1 === ".")) {
                        if ((lbl === "out" || lbl === "local") && inner2[ix].camNum.trim() !== "") {
                            var mObj = {};
                            mObj.camNum = inner2[ix].camNum;
                            mObj.missingOut = (lbl === "out") ? "N" : "Y";
                            mObj.missingLocal = (lbl === "local") ? "N" : "Y";

                            $scope.missingMaster.push(mObj);
                        }
                        if((lbl === "fieraout" || lbl === "source") && inner2[ix].camNum.trim() !== ""){
                            $scope.missingCamOut += inner2[ix].camNum + ",";

                        }
                        $scope.errorMessage += $sce.trustAsHtml("Missing Camera in " + lbl + " : " + inner2[ix].camNum + "<br/>");
                    }
                }
                if (!errorOnly) {
                    $scope.masterJSON.push(lineObj);
                }

            }
        };

        $scope.parseFile = function (file) {

            var textLines = file.split(/\n/);
            var processed = [];
            var currentGroupIndex = 0;
            var groupId = 0;
            var isData = true;
            $scope.lastlines = [];

            $scope.groups = [];
            $scope.groups.push({groupId: "filesTop", groupName: "SCROLL TO TOP"});

            for (var ix = 0; ix < textLines.length; ix++) {
                var mainTitle = false;
                var section = textLines[ix];
                var nextLine = textLines[ix + 1];
                var lines = section.split('||');


                var lineObj = {};
                lineObj.index = ix;
                lineObj.groupIndex = 0; //index cam in group

                if (lines.length === 1) {
                    if (nextLine && nextLine.split('||').length === 1) {
                        mainTitle = true;
                    }
                    lineObj.groupTitle = true;
                    lineObj.group = lines[0];
                    $scope.currentGroup = lineObj.group;
                    if ($scope.currentGroup) {
                        if ($scope.currentGroup.trim() !== '' && !mainTitle) {
                            $scope.groups.push({groupId: groupId, groupName: $scope.currentGroup});

                        }
                        lineObj.groupId = groupId;
                        groupId++;

                    }

                    currentGroupIndex = 0;
                }
                else {


                    lineObj.group = $scope.currentGroup;
                    lineObj.groupId = Number(groupId) - 1;
                    lineObj.groupTitle = false;
                    lineObj.camNum = lines[0];
                    lineObj.camNumFormatted = lineObj.camNum.replace('.', '');
                    if (lineObj.camNum.startsWith('.')) {
                        lineObj.comment = true;
                    }
                    else {
                        lineObj.comment = false;
                    }
                    if (!lineObj.comment) {
                        currentGroupIndex++;
                    }
                    lineObj.groupIndex = currentGroupIndex;
                    lineObj.isNew = false;
                    lineObj.dns = lines[1];
                    lineObj.prop1 = lines[2];
                    lineObj.prop2 = lines[3];
                    lineObj.prop3 = lines[4];
                    lineObj.prop4 = lines[5];
                    lineObj.desc = lines[6];
                    lineObj.desc = lines[6];
                    lineObj.descShort = $scope.parseDescription(lineObj.desc);
                    lineObj.lastLines = !isData;
                }
                if (lines.length === 0 || lines[0] === "" || lines[0] === "\r" || lines[0] === "\n") {  //empty line
                    isData = false;
                }
                if (!lineObj.lastLines) {
                    processed.push(lineObj);
                }
                else {
                    $scope.lastlines.push(textLines[ix]);
                }


            }
            return processed;
        };

        $scope.createFile = function (val) {
            $scope.toSave = [];
            $scope.toSaveLines = "";
            for (var ix = 0; ix < $scope.masterJSON.length; ix++) {
                var lineToSave = "";
                var lineObj = $scope.masterJSON[ix];
                if (lineObj.groupTitle) {
                    lineToSave += lineObj.group;
                }
                else {
                    lineToSave += lineObj.camNum + "||";
                    if (val === "out") {
                        lineToSave += lineObj.dns + "||";
                    }
                    if (val === "local") {
                        lineToSave += lineObj.dns3 + "||";
                    }
                    lineToSave += lineObj.prop1 + "||";
                    lineToSave += lineObj.prop2 + "||";
                    lineToSave += lineObj.prop3 + "||";
                    lineToSave += lineObj.prop4 + "||";

                    lineToSave += lineObj.groupIndex + "-" + lineObj.camNumFormatted + " " + lineObj.descShort;

                }

                $scope.toSave.push(lineToSave);

            }
            $scope.toSave.push("\n\n");

            $scope.toSave = $scope.toSave.concat($scope.lastlines);
            $scope.toSaveLines = $scope.toSave.toString();
            $scope.toSaveLines = $scope.toSaveLines.replace(/,/g, '\n');

            $scope.fileName = val;

            var link = document.getElementById('downloadlink');
            link.href = $scope.makeTextFile($scope.toSaveLines);
            link.style.display = 'block';
        };

        $scope.parseDescription = function (val) {
            if (!val) {
                return val;
            }
            var ix = val.indexOf(" ");
            if (ix <= 0) {
                return val;
            }
            return val.substring(val.indexOf(" ") + 1);
        };
        $scope.removeIt = function (val, toRemove) {
            var isComment = toRemove.comment;
            var cumNumber = toRemove.camNum;
            var toRemoveGroupId = Number(toRemove.groupId);
            var toRemoveix = toRemove.index;


            var duplicates = ($filter('filter')($scope.masterJSON, {camNum: cumNumber}, true));
            if (duplicates.length === 1 && !duplicates[0].comment && !toRemove.isNew) {
                var isOk = confirm("Are you sure you want to remove the only camera?"); //jshint ignore: line
                if (!isOk) {
                    return;
                }
            }

            $scope.masterJSON.splice(val, 1);
            if (isComment) {
                return;
            }
            var founds = [];

            for (var ix = 0; ix < $scope.masterJSON.length; ix++) {
                if (Number($scope.masterJSON[ix].groupId) === toRemoveGroupId) {
                    founds.push($scope.masterJSON[ix]);
                }

            }

            for (var xx = 0; xx < founds.length; xx++) {
                if (founds[xx].index >= toRemoveix && !founds[xx].comment) {
                    founds[xx].groupIndex--;
                }
            }
        };

        $scope.createNew = function (val, line, up) {
            var newIx = up ? line.groupIndex : line.groupIndex + 1;
            var founds = ($filter('filter')($scope.masterJSON, {groupId: line.groupId}, true));
            for (var ix = 0; ix < founds.length; ix++) {
                if (founds[ix].index >= line.index && up && !founds[ix].comment) {
                    founds[ix].groupIndex++;
                }
                if (founds[ix].index > line.index && !up && !founds[ix].comment) {
                    founds[ix].groupIndex = founds[ix].groupIndex + 1;
                }
            }

            var lineObj = {};
            lineObj.index = val;
            lineObj.group = line.group;
            lineObj.groupTitle = false;
            lineObj.groupId = line.groupId;
            lineObj.camNum = '';
            lineObj.groupIndex = newIx;
            lineObj.comment = false;
            lineObj.isNew = true;
            lineObj.lastLines = false;
            lineObj.dns = '';
            lineObj.prop1 = '';
            lineObj.prop2 = '';
            lineObj.prop3 = '';
            lineObj.prop4 = '';
            lineObj.desc = '';
            $scope.masterJSON.splice(val, 0, lineObj);

        };

        $scope.handleComment = function (line, uncomment) {
            var founds = ($filter('filter')($scope.masterJSON, {groupId: line.groupId}, true));
            var newGroupIndex = 0;
            var lastGroupIndex = 0;


            for (var ix = 0; ix < founds.length; ix++) {
                if (!founds[ix].comment) {
                    lastGroupIndex = founds[ix].groupIndex;
                }
                if (founds[ix].index >= line.index && uncomment && !founds[ix].comment) {

                    if (founds[ix].index > line.index && !founds[ix].comment && newGroupIndex === 0) {
                        newGroupIndex = founds[ix].groupIndex;
                    }

                    founds[ix].groupIndex++;

                }

                if (founds[ix].index > line.index && !uncomment && !founds[ix].comment) {
                    founds[ix].groupIndex--;
                }
            }
            if (newGroupIndex === 0) {
                newGroupIndex = lastGroupIndex;
            }
            if (uncomment) {
                line.groupIndex = newGroupIndex;
            }

            line.comment = !uncomment;


        };

        $scope.copyCamera = function (line) {
            var isFromSource = false;
            if (!line.isNew) {
                return;
            }
            var found = ($filter('filter')($scope.masterJSON, {camNum: line.camNum, isNew: false}, true))[0];
            if (!found) {
                found = ($filter('filter')($scope.sourceJSON, {camNum: line.camNum, isNew: false}, true))[0];
                if (!found) {
                    return;
                }
                isFromSource = true;
            }


            line.dns = found.dns;
            line.prop1 = found.prop1;
            line.prop2 = found.prop2;
            line.prop3 = found.prop3;
            line.prop4 = found.prop4;
            line.desc = found.desc;
            line.descShort = found.descShort;

            if (!isFromSource) {
                line.desc2 = found.desc2;
                line.dns2 = found.dns2;

                line.desc3 = found.desc3;
                line.dns3 = found.dns3;
            }
            else {
                line.desc2 = found.desc;
                line.dns2 = found.dns;

                line.desc3 = found.desc2;
                line.dns3 = found.dns2;
            }

            line.camNumFormatted = found.camNumFormatted;
        };


        $scope.updateValue = function (line, oldVal) {
            var newval = line.camNum;
            if (newval.trim() === oldVal) {
                return;
            }
            if (newval.substring(0, 1) === "." && oldVal.substring(0, 1) !== ".") {
                $scope.handleComment(line, false);
            }
            if (newval.substring(0, 1) !== "." && oldVal.substring(0, 1) === ".") {
                $scope.handleComment(line, true);
            }
        };

        $scope.gotoGroup = function (hash) {
            // set the location.hash to the id of
            // the element you wish to scroll to.
            $location.hash(hash);

            // call $anchorScroll()
            $anchorScroll();
        };

        $scope.makeTextFile = function (text) {
            text = text.replace(/\n/g, "\r\n");
            var data = new Blob([text], {type: 'text/plain'});

            // If we are replacing a previously generated file we need to
            // manually revoke the object URL to avoid memory leaks.
            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }

            textFile = window.URL.createObjectURL(data);

            return textFile;
        };

        $scope.findMissingNumbers = function (allNumbers, checkArray) {

            var result = [];

            for (var j = 0; j < allNumbers.length; j++) {

                // look for same thing in new array
                if (checkArray.indexOf(allNumbers[j]) == -1)
                    result.push(allNumbers[j]);

            }

            return result;

        }


        $scope.compareDesc = function (source) {
            var returnObj = [];
            for (var ix = 0; ix < source.length; ix++) {

                var line = source[ix];

                if (!line.groupTitle && line.camNum && ((line.camNum.trim() !== "") && (!isNaN(line.camNum) || line.camNum.substring(0, 1 === ".")))){
                    if (line.desc && line.desc2 && (line.desc.trim() != line.desc2.trim())) {
                        returnObj.push(line);
                    }
                }
            }
            return returnObj;
        };


        $scope.getRowColor = function (line) {
            var result = "";
            if (line.isNew) {
                result = "row-highlighted";
            }
            else if (line.comment) {
                result = "row-comment";
            }
            return result;
        }


    }

    angular.module('fieraApp')
        .controller('ReadFileCtrl', ReadFileCtrl)
        .directive('onReadFile', function ($parse) {
            return {
                restrict: 'A',
                scope: false,
                link: function (scope, element, attrs) {
                    var fn = $parse(attrs.onReadFile);

                    element.on('change', function (onChangeEvent) {
                        var reader = new FileReader();

                        reader.onload = function (onLoadEvent) {
                            scope.$apply(function () {
                                fn(scope, {$fileContent: onLoadEvent.target.result});
                            });
                        };

                        reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
                    });
                }
            };
        })

    ;
}());

