#pragma strict

//----------------------------------------
//  Constants
//----------------------------------------

var shootSound:AudioClip;
var hurtSound:AudioClip;
var stealSound:AudioClip;
var stashSound:AudioClip;
var toomuchMoneySound:AudioClip;
var reloadAnim:tk2dAnimatedSprite;
var reloadSound:AudioClip;

private var secsPerSteal = 0.5;
private var maxSpeed = 1.0f;
private var maxAccelMag = 10.0f;
private var respawnTime = 5.0;
private var bulletSpeed = 2.0;
private var accelForceScale = 5.0;
private var reloadTime = 2.0;

//----------------------------------------
//  Reference Cache
//----------------------------------------
private var gameRules:GameRules;
private var bulletPrefab:Bullet;
private var moneyPrefab:Money;
private var bloodPrefab:GameObject;
var statusText:TextMesh;

//----------------------------------------
//  Instance-constant state
//----------------------------------------
private var id = -1;
private var safe:Safe;
private var anim : tk2dAnimatedSprite;
private var spawnPos:Vector3;

//----------------------------------------
//  Game-varying state
//----------------------------------------
private var state = "idle";
private var trespassingCount : int[] = [0,0,0,0];
private var aimDir = Vector3(0,1);
private var health = 0;
private var deadTime = 0.0;
private var stealingTime = 0.0;
private var stealingFromSafe:Safe = null;
private var grabbedMoneys = List.<Money>();
private var hasGold = false;

private var ammo = 0;
private var weaponState = "ready";
private var reloadStartTime = 0.0;

function Awake()
{
    anim = GetComponent(tk2dAnimatedSprite);
    spawnPos = transform.position;
}

function Respawn()
{
    for(var i = 0; i < 4; i++ )
    {
        trespassingCount[i] = 0;
    }

    aimDir = Vector3(0,1);
    health = 5;
    deadTime = 0.0;
    stealingTime = 0.0;
    stealingFromSafe = null;
    grabbedMoneys.Clear();
    state = "playing";
    ammo = 6;
    weaponState = "ready";
    hasGold = false;

    reloadAnim.color = Color(0,0,0,0);
}

function Start ()
{
    bulletPrefab = GameObject.Find("bulletPrefab").GetComponent(Bullet);
    moneyPrefab = GameObject.Find("moneyPrefab").GetComponent(Money);
    gameRules = GameObject.Find("gameRules").GetComponent(GameRules);
    bloodPrefab = GameObject.Find("bloodPrefab");

    if(bulletPrefab == null)
    {
        Debug.LogError("Could not find bulletPrefab");
    }
}

function GetIsTrespassingOn( playerId:int ) : boolean
{
    return trespassingCount[playerId] > 0;
}

function GetId() : int
{
    return id;
}

function SetId(id:int)
{
    this.id = id;
    anim.Play("walk"+id);
}

function OnStartGame()
{
    Respawn();
}

function Update()
{
    var i = 0;

    // Don't have it rotate with us
    statusText.transform.position = transform.position + Vector3(0,0.1,0);
    statusText.transform.rotation = Quaternion.identity;

    if( state == "playing" )
    {
        var HButton = "H"+id;
        var VButton = "V"+id;
        var moveInput = Vector3( Input.GetAxisRaw(HButton), Input.GetAxisRaw(VButton), 0 );

        // prevent diagonal extra speed
        if( moveInput.magnitude > 1.0 )
        {
            moveInput = moveInput.normalized;
        }
        // sensitivity threshold
        else if( moveInput.magnitude < 0.5 )
        {
            moveInput = Vector3(0,0,0);
        }

        // Update aim direction
        if( moveInput.magnitude > 0.0 )
        {
            aimDir = moveInput.normalized;
            transform.rotation.eulerAngles.z = Mathf.Atan2( aimDir.y, aimDir.x ) * Mathf.Rad2Deg - 90.0;
        }

        // Apply forces to enforce goal speed

        var goalVel = moveInput * (hasGold ? maxSpeed*0.40 : maxSpeed);

        var deltaVelocity = accelForceScale*(goalVel - rigidbody.velocity);
        var accel = deltaVelocity;// / Time.deltaTime;

        if( accel.magnitude > maxAccelMag )
        {
            accel = accel.normalized * maxAccelMag;
        }
        rigidbody.AddForce( rigidbody.mass * accel );

        // Handle firing

        if( weaponState == "ready" )
        {
            var FireButton = "F"+id;
            if( Input.GetButtonDown(FireButton) )
            {
                var bullet = Instantiate( bulletPrefab, transform.position, Quaternion.identity );
                bullet.OnFire(aimDir*bulletSpeed);
                bullet.SetOwner(this);
                AudioSource.PlayClipAtPoint( shootSound, transform.position );

                ammo--;
                if( ammo <= 0 )
                {
                    weaponState = "reload";
                    reloadStartTime = Time.time;
                    AudioSource.PlayClipAtPoint( reloadSound, transform.position );
                    reloadAnim.color = Color(1,1,1,0.5);
                    reloadAnim.Play();
                }
            }
        }
        else if( weaponState == "reload" )
        {
            if( Time.time - reloadStartTime > reloadTime )
            {
                weaponState = "ready";
                ammo = 6;
                reloadAnim.color = Color(0,0,0,0);
            }
        }

        statusText.text = "";
        for( i = 0; i < health; i++ )
        {
            statusText.text += "=";
        }
        statusText.text += "";

        // Trespassing state

        var trespassing = false;
        for( i = 0; i < 4; i++ )
        {
            if( i != id && GetIsTrespassingOn(i) )
            {
                trespassing = true;
                break;
            }
        }

        if( trespassing )
        {
            statusText.text += "\nDANGER";
        }

        // Steal from safe?
        if( stealingFromSafe != null )
        {
            stealingTime += Time.deltaTime;
            if( stealingTime >= secsPerSteal )
            {
                if( stealingFromSafe.GetAmount() > 0 )
                {
                    Debug.Log("stealing a moneys!");
                    var stolen = Instantiate( moneyPrefab, transform.position, Quaternion.identity );
                    stealingFromSafe.AddMoney(-1);
                    AudioSource.PlayClipAtPoint( stealSound, transform.position );
                }

                stealingTime = 0.0;
            }
        }
    }
    else if( state == "dead" )
    {
        deadTime += Time.deltaTime;

        if( deadTime > respawnTime )
        {
            Respawn();
        }
        else
        {
            statusText.text = "RESPAWN IN " + Mathf.CeilToInt(respawnTime - deadTime);
            rigidbody.velocity = Vector3(0,0,0);
            transform.rotation = Quaternion.identity;
        }
    }

    // update animation according to velocity
    if( rigidbody.velocity.magnitude > 0.1 )
    {
        if( !anim.isPlaying() )
        {
            anim.Play();
        }
    }
    else
    {
        anim.Stop();
    }
}

function OnTriggerEnter(other : Collider) : void
{
    var tile = other.GetComponent(Tile);
    var bullet = other.GetComponent(Bullet);
    var safe = other.GetComponent(Safe);
    var money = other.GetComponent(Money);

    Debug.Log("trigger enter");

    if( tile != null )
    {
        if( tile.isPrivate )
        {
            trespassingCount[tile.GetOwner()]++;
        }
    }
    else if( bullet != null )
    {
        gameRules.OnBulletHit( bullet, this.GetComponent(Player) );
    }
    else if( safe != null )
    {
        if( safe == this.safe )
        {
            if( grabbedMoneys.Count > 0 )
            {
                // MONEY IN MY BANK!
                for( var m:Money in grabbedMoneys )
                {
                    safe.AddMoney( m.GetIsGold() ? 5 : 1 );
                    m.OnCashedIn();
                }

                grabbedMoneys.Clear();
                AudioSource.PlayClipAtPoint(stashSound, transform.position);
                hasGold = false;
            }
        }
        else
        {
            // stealing from a safe!
            if( stealingFromSafe == null )
            {
                stealingFromSafe = safe;
                stealingTime = 0.0;
            }
        }
    }
    else if( money != null )
    {
        if( !money.GetIsGrabbed() )
        {
            if( grabbedMoneys.Count < 5 )
            {
                if( grabbedMoneys.Count == 0 )
                {
                    money.OnGrabbed(this.transform);
                }
                else
                {
                    // make it follow the last money
                    money.OnGrabbed( grabbedMoneys[ grabbedMoneys.Count-1 ].gameObject.transform );
                }

                grabbedMoneys.Add(money);
                if( money.GetIsGold() )
                {
                    hasGold = true;
                }
            }
            else
            {
                // can't grab anymore
                AudioSource.PlayClipAtPoint( toomuchMoneySound, transform.position );
            }
        }
    }
}

function OnTriggerExit(other : Collider) : void
{
    var tile = other.GetComponent(Tile);
    var safe = other.GetComponent(Safe);

    if( tile != null )
    {
        if( tile.isPrivate )
        {
            trespassingCount[tile.GetOwner()]--;
        }
    }
    else if( safe != null )
    {
        if( safe == stealingFromSafe )
        {
            stealingFromSafe = null;
        }
    }
}

function OnDamaged(amt:int, bullet:Bullet)
{
    health -= amt;

    if( health <= 0 )
    {
        // Drop all my money
        for( var m:Money in grabbedMoneys )
        {
            m.OnDrop();
        }
        grabbedMoneys.Clear();

        state = "dead";
        deadTime = 0.0;
        transform.position = spawnPos;

        gameRules.OnPlayerDied(this);
    }

    AudioSource.PlayClipAtPoint( hurtSound, transform.position );
    Instantiate( bloodPrefab, transform.position, bullet.gameObject.transform.rotation );
}

function SetSafe(safe:Safe)
{
    this.safe = safe;
}


function GetAmountInSafe() : int
{
    return this.safe.GetAmount();
}

function GetSafe()
{
    return this.safe;
}

function GetExpansionCost() : int
{
    return gameRules.GetExpansionCost(GetId());
}
