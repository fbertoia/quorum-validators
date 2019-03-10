'use strict'

$( document ).ready(async function() {
    $("#address").val("localhost")
    $("#port").val("22002")
    let nodeAddress = "http://" + $("#address").val() + ":" + $("#port").val()
    var validConnection = true

    var proposeCandidate = function(address, vote){
        $.ajax({
            type: "POST",
            url: nodeAddress,
            data: JSON.stringify({"jsonrpc":"2.0","method":"istanbul_propose","params":[address, vote],"id":1}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
        
    }
    var discardCandidate = function(address){
        $.ajax({
            type: "POST",
            url: nodeAddress,
            data: JSON.stringify({"jsonrpc":"2.0","method":"istanbul_discard","params":[address],"id":1}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
        
    }

    
    var renderValidators = function(validatorList, candidatesList){
        $("#validatorList").empty();
        validatorList.forEach((address) => {
            $("#validatorList").append("\
            <tr class='node-row'>\
                <td>"+address+"</td>\
                <td><button class='btn btn-danger voteOut' data-address='"+address+"'>Vote Out</button></td>\
            </tr>")   
        });
        $("#candidateList").empty();
        console.log(candidatesList)
        Object.keys(candidatesList).forEach( (candidate) => {
            $("#candidateList").append("<tr class='node-row candidate-row'>\
            <td>"+candidate+"</td>" +
            (candidatesList[candidate] ? 
                 "<td><button class='btn btn-danger voteOut' data-address='"+candidate+"'>Vote Out</button></td>"
                : "<td><button class='btn btn-primary voteIn' data-address='"+candidate+"'>Vote In</button></td>")
            + "<td><button class='btn btn-warning voteDiscard' data-address='"+candidate+"'>Discard</button></td></tr>"
            )   
        })
        
        
        $(".voteIn").click(async (event)=> {
            var address = event.currentTarget.attributes["data-address"].value
            proposeCandidate(address, true);
        })
        
        $(".voteOut").click(async (event)=> {
            var address = event.currentTarget.attributes["data-address"].value
            proposeCandidate(address, false);
        })

        $(".voteDiscard").click(async (event)=> {
            var address = event.currentTarget.attributes["data-address"].value
            discardCandidate(address);
        })
    }
    var updateBlockNumber = function(blockNumber){
        $("#blockNumberText").text("Current Block Number: " + Number(blockNumber))
    }
    
    await setInterval(async () => {
        var currentBlockNumber = 0;
        nodeAddress = "http://" + $("#address").val() + ":" + $("#port").val()
        
        const errorConnection = (jqXHR, textStatus) => {
            jqXHR.abort()
            $("#validatorList").empty()
            $("#candidateList").empty()
        }
        await $.ajax({
            type: "POST",
            url: nodeAddress,
            data: JSON.stringify({"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}),
            success: (data => {validConnection = true ; currentBlockNumber = data.result}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).fail(errorConnection)

        var validatorsList = [];
        await $.ajax({
            type: "POST",
            url: nodeAddress,
            data: JSON.stringify({"jsonrpc":"2.0","method":"istanbul_getValidators","params":[currentBlockNumber],"id":1}),
            success:(data => {validConnection = true ; validatorsList = data.result}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).fail(errorConnection)

        var candidatesList = [];
        await $.ajax({
            type: "POST",
            url: nodeAddress,
            data: JSON.stringify({"jsonrpc":"2.0","method":"istanbul_candidates","params":[currentBlockNumber],"id":1}),
            success:(data => {validConnection = true ; candidatesList = data.result}),
            error: errorConnection,
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).fail(errorConnection)
        if (validConnection) {
            renderValidators(validatorsList, candidatesList)
            updateBlockNumber(currentBlockNumber)
        }
    }, 1000)
    
    $("#propose-btn").click(async () => {
        var candidateAddress = $("#propose-input").val();
        proposeCandidate(candidateAddress, true);
    })

});
