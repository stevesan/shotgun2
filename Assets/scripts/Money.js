#pragma strict

var grabSound:AudioClip;
var isGold = false;

private var state = "idle";
private var leader:Transform;

private var floatSpeed = 1.0;

function Start ()
{
    collider.isTrigger = true;
}

function Update () {

    if( state == "grabbed" && leader != null)
    {
        // move towards player
        var goal = leader.position;
        var delta = goal - transform.position;

        if( delta.magnitude > 0.1 )
        {
            transform.position += delta.normalized * floatSpeed * Time.deltaTime;
        }
    }
}

function OnSpawn()
{
    state = "idle";
    leader = null;
    GetComponent(tk2dSprite).color = Color(1,1,1,1);
    transform.localScale = Vector3(1.0, 1.0, 1.0);
}

function OnTriggerEnter(other : Collider) : void
{
}

function OnCashedIn()
{
    state = "idle";
    leader = null;
    Destroy(gameObject);
}

function OnDrop()
{
    state = "idle";
    leader = null;
    GetComponent(tk2dSprite).color = Color(1,1,1,1);
    transform.localScale = Vector3(1.0, 1.0, 1.0);
}

function OnGrabbed(leader:Transform)
{
    this.leader = leader;
    state = "grabbed";
    AudioSource.PlayClipAtPoint( grabSound, transform.position );
    GetComponent(tk2dSprite).color = Color(1,1,1,0.5);
    transform.localScale = Vector3(0.75, 0.75, 0.75);

}

function GetIsGrabbed()
{
    return state == "grabbed";
}

function GetIsGold() { return isGold; }
