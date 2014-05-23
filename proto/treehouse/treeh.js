var TreeH = {};
TreeH.tabs = {
    "tab-home": "house",
    "tab-lemonade": "stand",
    "tab-upgrades": "upgrades",
    "tab-inventory": "inventory"
}
TreeH.statuses = {
    "low_profit": [
        "You are making money, slowly but steadily."
    ],
    "med_profit": [
        "Your lemonade stand is providing a steady income."
    ],
    "high_profit": [
        "The cash is coming in quick and fast!"
    ],
    "popularity_00": [
        "Nobody knows about your treehouse.",
        "I don't think even your mother has noticed yet."
    ],
    "popularity_01": [
        "Your friends and family have started to notice.",
        "Your sister likes to visit the treehouse, but only to humour you."
    ],
    "popularity_05": [
        "A few people have heard about your place."
    ],
    "random": [
        "You had an average school day.",
        "Are you really stoked about making some money?",
        "That treehouse was a lot more fun to build than you thought.",
        "A fluffy dog came by the treehouse!"
    ]
}
// possible costs:
// item: Sacrifice the items in the array in your inventory.
// money: Self explanatory.
// resource: Also self explanatory.
//
// possible effects:
// income: Affects the moneyRate.
// popular: Increases or decreases popularity.
// resource: Yay for more resources!
//
// possible unlock conditions:
// popular: Self explanatory.
// time: After only this amount of steps.
// item: When you have all of the items in the array in your inventory.
// upgrade: When you have all of the upgrades in the array in your list. (Syntax: house:upgrade_name or stand:upgrade_name)
TreeH.store = [
    {unlocked:{popular:0.00,upgrade:["ladder"]},id:"test1",name:"Approval",cost:{money:10},effect:{income:+0.2},unique:true,for:"house",desc:"A housing permit!"},
    {unlocked:{popular:0.00,item:["test1"]},id:"test2",name:"Test 2",cost:{money:20},effect:{popular:+0.005},unique:true,for:"house",desc:"Still testing."}
];
TreeH.init = function () {
    TreeH.money = 0; // in cents
    TreeH.moneyRate = 0.4; // cents per minute (second irl)
    TreeH.resources = 0; // no limit on resources
    TreeH.popularity = 0.0; // out of 1(00%)
    TreeH.time = "00:00"; // 24-hour time
    TreeH.tLast = new Date().getTime(); // unix timestamp of last step
    TreeH.day = 1;
    TreeH.tInterval = 1000; // ms per step
    TreeH.steps = 0; // total steps
    TreeH.conditions = []; // array of conditions to consider
    TreeH.upgrades = [
        {id:"ladder",name:"Ladder",for:"house"},
        {id:"house",name:"Treehouse",for:"house"},
        {id:"sign",name:"Sign",for:"stand"}
    ];
    TreeH.inventory = [];
    $(".section").hide(); // hides all tabs
    $("#house").show(); // shows current one
    TBI.timerClear("treeh"); // clears loop
    TreeH.loop(true);
    TBI.timerSet("treeh", 50, function () { // creates loop
        TreeH.loop(); // run stuff
    });
}
TreeH.addTime = function (minCount) {
    minCount = parseInt(minCount);
    var time = TreeH.time.split(":");
    time[0] = parseInt(time[0]);
    time[1] = parseInt(time[1]);
    while (time[1] + minCount >= 60) {
        if (time[0]+1 < 24) time[0]++
        else { 
            time[0] = 0;
            TreeH.day++;
        }
        minCount -= 60;
    }
    time[1] += minCount;
    if (time[0] < 10) time[0] = "0"+time[0];
    if (time[1] < 10) time[1] = "0"+time[1];
    return time[0].toString()+":"+time[1].toString();
}
TreeH.updateResources = function () {
    var money = TreeH.money/100;
    $("#stat-money").html(money.toFixed(2));
    var res = TreeH.resources.toString();
    while (res.length < 6) res = "0"+res;
    $("#stat-resource").html(res);
    $("#stat-time").html(TreeH.time);
    $("#stat-day").html(TreeH.day);
    $("#stat-popular").html((TreeH.popularity * 100).toFixed(2) + "%");
    $("#stat-standmm").html(TreeH.moneyRate);
    $("#stat-standmh").html(TreeH.moneyRate*60);
    $("#stat-standmd").html(TreeH.moneyRate*60*24);
}
TreeH.updateConditions = function () {
    var temparr = [];
    if (TreeH.moneyRate < 10) temparr.push("low_profit");
    else if (TreeH.moneyRate < 100) temparr.push("med_profit");
    else temparr.push("high_profit");
    if (TreeH.popularity < 0.01) temparr.push("popularity_00");
    else if (TreeH.popularity < 0.05) temparr.push("popularity_01");
    else temparr.push("popularity_05");
    TreeH.conditions = temparr;
}
TreeH.updateStatus = function (message) {
    if (!isNull(message)) $("#notification").html(message)
    else if (TreeH.conditions.length > 0) {
        var rand = randomInt(TreeH.conditions.length);
        var status = TreeH.statuses[TreeH.conditions[rand]];
        for (var i=0,t=[];i<TreeH.conditions.length;i++) if (i != rand) t.push(TreeH.conditions[i]);
        TreeH.conditions = t;
        $("#notification").html(status[randomInt(status.length)]);
    } else $("#notification").html(TreeH.statuses.random[randomInt(TreeH.statuses.random.length)]);
}
TreeH.searchInventory = function (id) {
    var inv = TreeH.inventory;
    for (var i=0;inv.length;i++)
        if (inv[i].id = id) return i;
    return -1;
}
TreeH.searchUpgrades = function (id) {
    var list = TreeH.upgrades;
    for (var i=0;i<list.length;i++)
        if (list[i].id == id) return i;
    return -1;
}
TreeH.searchStore = function (id) {
    var list = TreeH.store;
    for (var i=0;i<list.length;i++)
        if (list[i].id == id) return i;
    return -1;
}
TreeH.findStoreItemByName = function (name) {
    var list = TreeH.store;
        for (var i=0;i<list.length;i++)
            if (list[i].name == name) return list[i].id;
    return null;
}
TreeH.checkAvailability = function (storeItem) {
    var it = storeItem.unlocked;
    if (isNull(it.popular) || TreeH.popularity >= it.popular) {
        if (isNull(it.time) || TreeH.steps >= it.time) {
            var valid = 0,
                compare = 0;
            if (!isNull(it.item)) {
                compare += it.item.length;
                for (var i=0;i<it.item.length;i++)
                    if (TreeH.searchInventory(it.item[i]) != -1) valid++;
            }
            if (!isNull(it.upgrade)) {
                compare += it.upgrade.length;
                for (var i=0;i<it.upgrade.length;i++)
                    if (TreeH.searchUpgrades(it.upgrade[i]) != -1) valid++;
            }
            return valid == compare;
        } else return false;
    } else return false;
}
TreeH.checkPrice = function (storeItem) {
    var it = storeItem.cost;
    if (isNull(it.money) || TreeH.money >= it.money) {
        if (isNull(it.resource) || TreeH.resource >= it.resource) {
            if (!isNull(it.item)) {
                for (var i=0,v=0;i<it.item.length;i++)
                    if (TreeH.searchInventory(it.item[i]) != -1) v++;
                return v == it.item.length;
            } else return true;
        } else return false;
    } else return false;
}
TreeH.updateUpgrades = function () {
    var upg = TreeH.upgrades;
    $("#stat-upgrades").empty();
    $("#stat-standup").empty();
    for (var i=0;i<upg.length;i++)
        if (upg[i].for == "house") $("#stat-upgrades").append("<li><span>"+upg[i].name+"</span></li>");
        else if (upg[i].for == "stand") $("#stat-standup").append("<li><span>"+upg[i].name+"</span></li>");
    var store = TreeH.store;
    $("#stat-upgavail").empty();
    $("#stat-upgunavail").empty();
    for (var i=0;i<store.length;i++)
        if (TreeH.checkAvailability(store[i])) $("#stat-upgavail").append("<li><span>"+store[i].name+"</span></li>");
        else $("#stat-upgunavail").append("<li>"+store[i].name+"</li>");
    $("#stat-upgavail li span").off("click");
    $("#stat-upgavail li span").click(function () {
        TreeH.buy(TreeH.findStoreItemByName(this.innerHTML));
        $(this).off("click");
        $(this).remove();
    });
}
TreeH,staticEffect = function (item) {
    var it = item.effect;
    if (!isNull(it.income)) TreeH.moneyRate += it.income;
    if (!isNull(it.popular)) TreeH.popularity += it.popular;
    if (!isNull(it.resource)) TreeH.resources += it.resource;
}
TreeH.updateInventory = function () {
    $("#stat-items").empty();
    var inv = TreeH.inventory;
    for (var i=0;i<inv.length;i++)
        $("#stat-items").append("<li><strong>"+inv[i].name+": </strong>"+inv[i].desc+"</li>");
}
TreeH.buy = function (id) {
    var loc = TreeH.searchStore(id);
    var upg = TreeH.store[loc];
    var items = [], itemString = "";
    if (!isNull(upg.cost.money))
        items.push("$"+(upg.cost.money/100).toFixed(2));
    if (!isNull(upg.cost.resource))
        items.push(upg.cost.resource+" resources");
    if (!isNull(upg.cost.item)) for (var i=0;i<upg.cost.item.length;i++) items.push(upg.cost.item[i]);
    for (var i=0;i<items.length;i++) {
        if (i < items.length-2) itemString += items[i] + ", ";
        else if (i == items.length-2) itemString += items[i] + " and ";
        else itemString += items[i];
    }
    if (TreeH.checkPrice(upg))
        TBI.dialog("Purchase Confirmation", "Would you like to purchase " + upg.name + " for: " + itemString + "?", function () {
            if (!isNull(upg.cost.money)) TreeH.money -= upg.cost.money;
            if (!isNull(upg.cost.resource)) TreeH.resources -= upg.cost.resource;
            if (!isNull(upg.cost.item))
            for (var i=0;i<upg.cost.item.length;i++)
                TreeH.inventory.splice(TreeH.searchInventory(upg.cost.item[i]));
            TreeH.updateStatus("Successfully purchased "+upg.name+"!");
            TreeH.store.splice(loc, 1);
            TreeH.inventory.push(upg);
        });
    else {
        var needed = [], failString = "";
        if (!isNull(upg.cost.money))
            needed.push("$"+((upg.cost.money-TreeH.money)/100).toFixed(2));
        if (!isNull(upg.cost.resource))
            needed.push((upg.cost.resource-TreeH.resources)+" resources");
        if (!isNull(upg.cost.item))
            for (var i=0;i<upg.cost.item.length;i++)
                if (TreeH.searchInventory(upg.cost.item[i]) == -1) needed.push(upg.cost.item[i]);
        for (var i=0;i<needed.length;i++) {
            if (i < needed.length-2) failString += needed[i] + ", ";
            else if (i == needed.length-2) failString += needed[i] + " and ";
            else failString += needed[i];
        }
        TreeH.updateStatus("You need the following to buy "+upg.name+": "+failString);
    }
}
TreeH.loop = function (stepOverride) {
    var time = new Date().getTime();
    var step = TreeH.tLast + TreeH.tInterval < time;
    var minadd = step ? Math.ceil(2/TreeH.tInterval) : 0;
    if (step || stepOverride) { 
        TreeH.tLast = time;
        TreeH.time = TreeH.addTime(minadd);
        TreeH.money = parseFloat((TreeH.money + TreeH.moneyRate).toFixed(6));
        TreeH.steps++;
        TreeH.updateResources();
        TreeH.updateUpgrades();
        TreeH.updateInventory();
        if (TreeH.steps % 40 == 0 || stepOverride) TreeH.updateConditions();
        if (TreeH.steps % 10 == 0 || stepOverride) TreeH.updateStatus();
    }
}
$(function () {
    TreeH.init();
    $(".s-tab").click(function () {
        if (this.className.search(" s-tab-current")!=-1) return false;
        $(".s-tab-current")[0].className = $(".s-tab-current")[0].className.replace(" s-tab-current","");
        this.className += " s-tab-current";
        TreeH.tInterval = 1000/parseInt(this.innerText);
    });
    $(".tab").click(function () {
        if (this.className.search(" tab-current")!=-1) return false;
        $(".tab-current")[0].className = $(".tab-current")[0].className.replace(" tab-current","");
        this.className += " tab-current";
        $(".section").hide();
        $("#"+TreeH.tabs[this.id]).show();
    });
});