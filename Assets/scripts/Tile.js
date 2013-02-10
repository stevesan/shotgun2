#pragma strict

var isPrivate = false;
var ownerId = -1;

function Awake () {
    collider.isTrigger = true;
}

function Update () {

}

function SetOwner( pid:int )
{
    ownerId = pid;
}

function GetOwner() { return ownerId; }

function OnTriggerEnter(other : Collider) : void
{
}
