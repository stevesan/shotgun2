#pragma strict

static function RemoveNulls( moneys:List.<Money> )
{
    // Remove them in reverse
    for( var j = moneys.Count-1; j >= 0; j-- )
    {
        if( moneys[j] == null )
        {
            moneys.RemoveAt(j);
        }
    }
}
