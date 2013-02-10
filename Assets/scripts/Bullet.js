#pragma strict

private var owner:Player;

private var lifetime = 0.0;

private var maxLifeTime = 1.0;

private var state = "inactive";

private var velocity = Vector3(0,0,0);

function Start()
{
    Debug.Log("created bullet");
}

function Update()
{
    if( state == "fired" )
    {
        lifetime += Time.deltaTime;

        if( lifetime > maxLifeTime )
        {
            Destroy(gameObject);
        }
    }
}

function OnFire(velocity:Vector3)
{
    rigidbody.velocity = velocity;
    transform.rotation.eulerAngles.z = Mathf.Atan2(velocity.y, velocity.x) * Mathf.Rad2Deg - 90.0;
    state = "fired";
    lifetime = 0.0;
}

function SetOwner(owner:Player)
{
    this.owner = owner;
}

function GetOwner() { return this.owner; }

function OnTriggerEnter(other : Collider) : void
{
    var hall = other.GetComponent(CityHall);
    var blocker = other.GetComponent(Blocker);
    if( hall != null )
    {
        Destroy(gameObject);
    }
    if( blocker != null && blocker.IsWhole() )
    {
		blocker.HitByBullet();
		Destroy(gameObject);
	}
}

function OnHit(victim:Player)
{
    Destroy(gameObject);
}
