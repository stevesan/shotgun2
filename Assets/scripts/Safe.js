#pragma strict

var label:TextMesh;

private var owner:Player;
private var amount = 0;
private var state = "idle";

private var stealers = new List.<Player>();

function Start () {

    collider.isTrigger = true;

}

function Update ()
{
    if( state == "active" )
    {
        if( amount >= owner.GetExpansionCost() )
        {
            label.text = "CITY HALL!!";
        }
        else
        {
            label.text = amount + "/" +owner.GetExpansionCost() +" USD";
        }
    }
    else
    {
        label.text = "";
    }
}

function GetOwner() { return owner; }

function GetAmount() { return amount; }

function OnStartGame(owner:Player)
{
    this.owner = owner;
    this.amount = 0;
    this.state = "active";
}

function AddMoney(amt:int)
{
    this.amount += amt;
}

