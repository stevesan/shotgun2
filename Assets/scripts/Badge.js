#pragma strict

function Start () {

    collider.isTrigger = true;
}

function Update () {

}

function OnGrabbed()
{
    Destroy(gameObject);
}
