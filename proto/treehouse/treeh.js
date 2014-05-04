var TreeH = {};
TreeH.init = function () {
    TreeH.money = 0;
    TreeH.resources = 0;
    TreeH.popularity = 0.0;
    TreeH.time = "00:00";
    TreeH.tLast = new Date().getTime();
    TreeH.day = 1;
    TreeH.tInterval = 1000;
    TBI.timerClear("treeh");
    TBI.timerSet("treeh", 50, function () {
        TreeH.loop();
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
    if (time[0] < 10) { time[0] = "0"+time[0]; }
    if (time[1] < 10) { time[1] = "0"+time[1]; }
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
}
TreeH.loop = function () {
    var time = new Date().getTime();
    var step = TreeH.tLast + TreeH.tInterval < time;
    var minadd = step ? Math.ceil(2/TreeH.tInterval) : 0;
    if (step) TreeH.tLast = time;
    if (step) TreeH.time = TreeH.addTime(minadd);
    TreeH.updateResources();
}
$(function () {
    TreeH.init();
    $(".s-tab").click(function () {
        if (this.className.search(" s-tab-current")!=-1) return false;
        $(".s-tab-current")[0].className = $(".s-tab-current")[0].className.replace(" s-tab-current","");
        this.className += " s-tab-current";
        TreeH.tInterval = 1000/parseInt(this.innerText);
    });
});