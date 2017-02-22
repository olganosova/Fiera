// ignore linting for this file
/* jshint ignore:start */
/**
 * Created by NOSOVO2 on 2/16/2016.
 */

(function () {
    'use strict';

    function ReadFileCtrl($scope, $filter, $location, $anchorScroll, $sce, $timeout) {

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
        $scope.missingCameras = [];
        $scope.missingComments = [];
        $scope.missingCamOut = "";
        $scope.missingCamSource = "";
        $scope.stage = "";
        $scope.filetoUpload = ["Sorce Out", "Source Local", 'Groups Out' ];
        $scope.descriptionChanged = false;
            

        $scope.errTableTitles = {};

        var textFile = null;


        $scope.loadFile = function ($fileContent) {
            var content = $fileContent;


            $scope.source.push(content);
            if ($scope.source.length === 2) {  //2 source files are loaded
                $scope.errorMessage = "";
                $scope.sourceJSON = [];
                $scope.masterJSON = [];

                var inner1 = $scope.parseFile($scope.source[0]); //master
                var inner2 = $scope.parseFile($scope.source[1]); //local

                $scope.processs2Files(inner1, inner2, "out", true);
                $scope.processs2Files(inner2, inner1, "local", false);
                $scope.errTableTitles.row1 = "Source Out";
                $scope.errTableTitles.row2 = "Source Local";
                $scope.sourceJSON = angular.copy($scope.masterJSON);
                //$scope.missingComments = angular.copy($scope.compareDesc($scope.sourceJSON));
                $scope.isShow = true;
                $scope.stage = "SOURCE";

            }
            if ($scope.source.length === 3) {
                $scope.sourceJSON = angular.copy($scope.masterJSON);
                $scope.missingCamOut = "";
                $scope.missingCamSource = "";
                $scope.joined = angular.copy($scope.masterJSON);
                $scope.masterJSON = [];
                $scope.missingCameras = [];
                $scope.missingComments = [];
                $scope.errTableTitles.row1 = "Groups";
                $scope.errTableTitles.row2 = "Source";
                $scope.stage = "GROUPS";
                var joined = $scope.joined;//source
                var fieraout = $scope.parseFile($scope.source[2]); //fiera out
                $scope.processs2Files(fieraout, joined, "fieraout", true);
                $scope.processs2Files(joined, fieraout, "source", false);
                $scope.isShow = true;

                $scope.toSave = [];
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
                        $scope.copyLine(lineObj, found);
                    }
                }
                else {
                    if (!isNaN(inner2[ix].camNum) || inner2[ix].camNum.substring(0, 1) === ".") {
                        if (inner2[ix].camNum.trim() !== "") {
                            var mObj = {};
                            mObj.camNum = inner2[ix].camNum;
                            mObj.missingGroups = (lbl === "fieraout" || lbl === "out") ? "N" : "Y";
                            mObj.missingOut = (lbl === "source" || lbl === "local") ? "N" : "Y";
                            if (inner2[ix].camNum.substring(0, 1) === ".") {
                                $scope.missingComments.push(mObj);
                            }
                            else if (!isNaN(inner2[ix].camNum)) {

                                $scope.missingCameras.push(mObj);


                            }


                        }
                        if ((lbl === "fieraout") && inner2[ix].camNum.trim() !== "") {
                            $scope.missingCamOut += inner2[ix].camNum + ",";
                        }
                        if ((lbl === "source") && inner2[ix].camNum.trim() !== "") {
                            $scope.missingCamSource += inner2[ix].camNum + ",";
                        }
                        $scope.errorMessage += $sce.trustAsHtml("Missing Camera in " + lbl + " : " + inner2[ix].camNum + "<br/>");
                    }
                    if (!errorOnly) {  //check if comment
                        var found = $scope.tryToFindMatch(lineObj, inner1); //($filter('filter')(inner1, {camNum: inner2[ix].camNum.replace(".", "")}, true))[0];
                        if (found) {
                            $scope.copyLine(lineObj, found);
                        }
                    }
                }

                if (!errorOnly) {
                    $scope.masterJSON.push(lineObj);

                }

            }
        };

        $scope.copyLine = function (lineObj, found) {
            lineObj.desc2 = found.desc;
            lineObj.dns2 = found.dns;
            lineObj.desc3 = found.desc2;
            lineObj.dns3 = found.dns2;
            lineObj.descShort = $scope.parseDescription(found.desc);
            if ($scope.stage === "GROUPS") {
                lineObj.dns = found.dns;
                lineObj.prop1 = found.prop1;
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
            //$scope.groups.push({groupId: "filesTop", groupName: "SCROLL TO TOP"});

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
                        if ($scope.currentGroup.trim()) {
                            $scope.groups.push({
                                groupId: groupId,
                                groupName: $scope.currentGroup,
                                isMain: mainTitle,
                                index: ix
                            });

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
                if (lines.length === 0 || lines[0].trim() === "" || lines[0] === "\r" || lines[0] === "\n") {  //empty line
                    isData = false;
                }
                if (!lineObj.lastLines) {
                    processed.push(lineObj);
                }
                else {
                    $scope.lastlines.push(textLines[ix].trim());
                }


            }
            return processed;
        };

        $scope.createFile = function (master, val, stage) {

            $scope.toSave = [];
            $scope.toSaveLines = "";
            for (var ix = 0; ix < master.length; ix++) {
                var lineToSave = "";


                var lineObj = master[ix];
                if (lineObj.groupTitle) {
                    lineToSave += lineObj.group;
                }
                else {
                    lineToSave += lineObj.camNum + "||";
                    if (val === "out") {
                        lineToSave += lineObj.dns + "||";
                    }
                    if (val === "local" && stage === 'GROUPS') {
                        lineToSave += lineObj.dns3 + "||";
                    }
                    if (val === "local" && stage === 'SOURCE') {
                        lineToSave += lineObj.dns2 + "||";
                    }
                    lineToSave += lineObj.prop1 + "||";
                    lineToSave += lineObj.prop2 + "||";
                    lineToSave += lineObj.prop3 + "||";
                    lineToSave += lineObj.prop4 + "||";

                    if (stage === 'GROUPS') {
                        lineToSave += lineObj.groupIndex + "-" + lineObj.camNumFormatted + " " + lineObj.descShort;
                    }
                    if (stage === 'SOURCE') {
                        lineToSave += lineObj.desc;
                    }

                }
                if (lineToSave === "" || lineToSave === "\n" || lineToSave === "\r" || lineToSave === "\r\n") {
                    continue;
                }
                $scope.toSave.push(lineToSave.trim());

            }
            //
            $scope.toSave.push("\r\n");
            // $scope.toSave.push("\n");
            $scope.toSave = $scope.toSave.concat($scope.lastlines);
            $scope.toSaveLines = $scope.toSave.toString();
            $scope.toSaveLines = $scope.toSaveLines.replace(/,/g, '\r\n');

            $scope.fileName = val;

            var link = document.getElementById('downloadlink');
            link.href = $scope.makeTextFile($scope.toSaveLines);
            link.download = stage + "-" + val + ".txt";

            $timeout(function () {
                link.click();
            });
           // link.style.display = 'block';
        };

        $scope.updateDesc =  function(line){
            $scope.descriptionChanged = true;
            var newDesc = line.descShort;
            //master
            var found = ($filter('filter')($scope.masterJSON, {camNum: line.camNum}, true));
            for(var ix=0; ix<found.length; ix++){
                found[ix].descShort = newDesc;
            }
            // //source
            var foundSource = ($filter('filter')($scope.sourceJSON, {camNum: line.camNum}, true));
            for(var ix=0; ix<foundSource.length; ix++){
                foundSource[ix].descShort = newDesc;
                var lastIx = foundSource[ix].desc.indexOf(" ");
                foundSource[ix].desc = foundSource[ix].desc.substring(0, lastIx) + " " + newDesc;
            }

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
            if (!toRemove.isDeleteCandidate) {
                toRemove.isDeleteCandidate = true;
                return;
            }
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

            $scope.updateIndexes(val, false);


        };

        $scope.createNew = function (val, line, up) {
            var newIx = up ? line.groupIndex : line.groupIndex + 1;

            var increment = 0;
            if (line.isNew) {
                increment = 1;
            }

            var founds = ($filter('filter')($scope.masterJSON, {groupId: line.groupId}, true));
            for (var ix = 0; ix < founds.length; ix++) {
                if (founds[ix].index >= line.index && up && !founds[ix].comment) {
                    founds[ix].groupIndex++;
                }
                if (founds[ix].index > line.index && !up && !founds[ix].comment) {

                    founds[ix].groupIndex++; //  founds[ix].groupIndex + increment;
                    //  console.log( founds[ix].groupIndex);
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
            lineObj.prop2 = '4';
            lineObj.prop3 = '10003';
            lineObj.prop4 = 'FIERA';
            lineObj.desc = '';
            $scope.updateIndexes(val, true);

            $scope.masterJSON.splice(val, 0, lineObj);

            var inputId = "id" + lineObj.index;
            $timeout(function () {
                var elm = document.getElementById(inputId);
                //var elm =  angular.element(inputId);
                elm.focus();
            });


        };

        $scope.updateIndexes = function (index, add) {
            for (var ix = 0; ix < $scope.masterJSON.length; ix++) {
                if ($scope.masterJSON[ix].index >= index) {
                    if (add) {
                        $scope.masterJSON[ix].index++;
                    }
                    if (!add) {
                        $scope.masterJSON[ix].index--;
                    }
                }
            }
        }

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

        $scope.copyCameraOnEnter = function (keyEvent, line) {

            if (keyEvent.which !== 13) {
                return;
            }

            $scope.copyCamera(line);

        }

        $scope.copyCamera = function (line) {
            var isFromSource = false;
            if (!line.isNew) {
                return;
            }
            var found = ($filter('filter')($scope.masterJSON, {camNum: line.camNum, isNew: false}, true))[0];
            if (!found) {
                found = ($filter('filter')($scope.sourceJSON, {camNum: line.camNum}, true))[0];
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
                line.camNumFormatted = found.camNumFormatted;
            }
            else {
                line.desc2 = found.desc;
                line.dns2 = found.dns;

                line.desc3 = found.desc2;
                line.dns3 = found.dns2;
                line.descShort = $scope.parseDescription(found.desc);
                line.camNumFormatted = found.camNum.replace('.', '');
            }


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
            //text = text.replace(/\n/g, "\r\n");
            var data = new Blob([text], {type: 'text/plain'});

            // If we are replacing a previously generated file we need to
            // manually revoke the object URL to avoid memory leaks.
            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }

            textFile = window.URL.createObjectURL(data);

            return textFile;
        };
        //ONLY DESCRIPTIONS
        $scope.createShortFile = function () {

            $scope.toSave = [];
            $scope.toSaveLines = "";
            for (var ix = 0; ix < $scope.masterJSON.length; ix++) {
                var lineToSave = "";


                var lineObj = $scope.masterJSON[ix];
                if (lineObj.groupTitle) {
                    lineToSave += lineObj.group;
                }
                else {
                 //   lineToSave += lineObj.camNum + "||";

                    lineToSave += lineObj.groupIndex + "-" + lineObj.camNumFormatted + " " + lineObj.descShort;


                }
                if (lineToSave === "" || lineToSave === "\n" || lineToSave === "\r" || lineToSave === "\r\n") {
                    continue;
                }
                $scope.toSave.push(lineToSave.trim());

            }
            //
            $scope.toSave.push("\r\n");

            $scope.toSaveLines = $scope.toSave.toString();
            $scope.toSaveLines = $scope.toSaveLines.replace(/,/g, '\r\n');

            $scope.fileName = 'NamesOnly';

            var link = document.getElementById('downloadlink');
            link.href = $scope.makeTextFile($scope.toSaveLines);

            link.download = $scope.fileName + ".txt";

            $timeout(function () {
                link.click();
            });
        };

        //GROUPS+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

        $scope.createNewGroup = function (val, line) {
           
            var lineObj = {};

            lineObj.index = val;
            lineObj.group = line.groupName;
            lineObj.groupTitle = true;
            lineObj.groupId = line.groupId;

            lineObj.groupIndex = 0;

            lineObj.isNew = true;
            lineObj.lastLines = false;

            $scope.updateIndexes(val, false);

            $scope.masterJSON.splice(val, 0, lineObj);
//
//             var lineObjG = {groupId: groupId, groupName: 'NEW GROUP', isMain: false, index: index};
//
//             $scope.groups.splice(index, 0, lineObjG);
//
//             $scope.updateGroupIndexes(index);


        };
        $scope.updateGroupIndexes = function (index) {
            for (var ix = 0; ix < $scope.groups.length; ix++) {
                if ( $scope.groups[ix].index >= index) {
                    $scope.groups[ix].index++;
                }
            }
        }

        $scope.findMissingNumbers = function (allNumbers, checkArray) {

            var result = [];

            for (var j = 0; j < allNumbers.length; j++) {

                // look for same thing in new array
                if (checkArray.indexOf(allNumbers[j]) == -1)
                    result.push(allNumbers[j]);

            }

            return result;

        };


        $scope.tryToFindMatch = function (line, source) {

            var found = ($filter('filter')(source, {camNum: "." + line.camNum}, true))[0]; //looking for comment
            if (found) {
                return found;
            }
            found = ($filter('filter')(source, {camNum: line.camNum.replace(".", "")}, true))[0];  //comment
            if (found) {
                return found;
            }


            return found;
        };


        $scope.getRowColor = function (line) {
            var result = "";

            //isDeleteCandidate
            if (line.isDeleteCandidate) {
                result = "row-deleted";
            }
            else if (line.isNew) {
                result = "row-highlighted";
            }
            else if (line.comment) {
                result = "row-comment";
            }

            return result;
        };

        $scope.getToolTipText = function(val){
            return  $scope.filetoUpload[val];
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

