#pragma strict

private var gameRules:GameRules;

function Start ()
{
    collider.isTrigger = false;
    gameRules = GameObject.Find("gameRules").GetComponent(GameRules);
}

function Update () {

}

function OnCollisionEnter( col : Collision ) : void
{
    var player = col.gameObject.GetComponent(Player);

    if( player != null )
    {
        gameRules.OnPlayerHitCityHall( player, this );
    }
}
