import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST() {
  // Create sample odds data that matches your actual structure
  const sampleOddsData = {
    "updated_at": 1759198515,
    "event": {
      "id": "64105a3e-2b4e-57c0-a377-7058ecadd2d4",
      "home": "BUF",
      "away": "NE", 
      "start": "2025-10-06T00:20:00.000Z",
      "live": false
    },
    "lines": {
      "38": {
        "line": 38,
        "books": {
          "hard-rock": {
            "over": {
              "price": -475,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/884933318244303107",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/884933318244303107"
              },
              "_is_main": false
            },
            "under": {
              "price": 350,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/7203483595445108995",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/7203483595445108995"
              },
              "_is_main": false
            }
          }
        }
      },
      "39": {
        "line": 39,
        "books": {
          "hard-rock": {
            "under": {
              "price": 325,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/6087980670554734849",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/6087980670554734849"
              },
              "_is_main": false
            },
            "over": {
              "price": -450,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/2014474807598121217",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/2014474807598121217"
              },
              "_is_main": false
            }
          }
        }
      },
      "40": {
        "line": 40,
        "books": {
          "betmgm": {
            "over": {
              "price": -375,
              "links": {
                "desktop": "https://sports.on.betmgm.ca/en/sports/events/17551714?options=17551714-1375199638--410210028&type=Single",
                "mobile": "playmgmsportswrp://events/17551714?options=17551714-1375199638--410210028&type=Single"
              },
              "_is_main": false
            },
            "under": {
              "price": 270,
              "links": {
                "desktop": "https://sports.on.betmgm.ca/en/sports/events/17551714?options=17551714-1375199638--410210027&type=Single",
                "mobile": "playmgmsportswrp://events/17551714?options=17551714-1375199638--410210027&type=Single"
              },
              "_is_main": false
            }
          },
          "hard-rock": {
            "under": {
              "price": 275,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/1553805823839043828",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/1553805823839043828"
              },
              "_is_main": false
            },
            "over": {
              "price": -400,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/7669694117808177396",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/7669694117808177396"
              },
              "_is_main": false
            }
          },
          "bwin": {
            "over": {
              "price": -375,
              "links": {
                "desktop": "https://bwin.com/en/sports/events/17551714?options=17551714-1375199638--410210028&type=Single",
                "mobile": null
              },
              "_is_main": false
            },
            "under": {
              "price": 270,
              "links": {
                "desktop": "https://bwin.com/en/sports/events/17551714?options=17551714-1375199638--410210027&type=Single",
                "mobile": null
              },
              "_is_main": false
            }
          },
          "draftkings": {
            "over": {
              "price": -380,
              "links": {
                "desktop": "https://sportsbook.draftkings.com/event/32225661?outcomes=0QA278702052%23349247019_13L88808Q1-192366131Q20",
                "mobile": null
              },
              "_is_main": false
            },
            "under": {
              "price": 280,
              "links": {
                "desktop": "https://sportsbook.draftkings.com/event/32225661?outcomes=0QA278702052%23349247020_13L88808Q1-2015862142Q20",
                "mobile": null
              },
              "_is_main": false
            }
          },
          "fanduel": {
            "over": {
              "price": -370,
              "links": {
                "desktop": "https://nj.sportsbook.fanduel.com/addToBetslip?marketId=42.529879716&selectionId=60339724",
                "mobile": "fanduelsportsbook://account.sportsbook.fanduel.com/sportsbook/addToBetslip?marketId=42.529879716&selectionId=60339724"
              },
              "_is_main": false
            },
            "under": {
              "price": 265,
              "links": {
                "desktop": "https://nj.sportsbook.fanduel.com/addToBetslip?marketId=42.529871378&selectionId=11925818",
                "mobile": "fanduelsportsbook://account.sportsbook.fanduel.com/sportsbook/addToBetslip?marketId=42.529871378&selectionId=11925818"
              },
              "_is_main": false
            }
          }
        }
      },
      "41": {
        "line": 41,
        "books": {
          "betmgm": {
            "over": {
              "price": -325,
              "links": {
                "desktop": "https://sports.on.betmgm.ca/en/sports/events/17551714?options=17551714-1375199638--410210030&type=Single",
                "mobile": "playmgmsportswrp://events/17551714?options=17551714-1375199638--410210030&type=Single"
              },
              "_is_main": false
            },
            "under": {
              "price": 240,
              "links": {
                "desktop": "https://sports.on.betmgm.ca/en/sports/events/17551714?options=17551714-1375199638--410210029&type=Single",
                "mobile": "playmgmsportswrp://events/17551714?options=17551714-1375199638--410210029&type=Single"
              },
              "_is_main": false
            }
          },
          "hard-rock": {
            "under": {
              "price": 245,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/5438302898948569347",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/5438302898948569347"
              },
              "_is_main": false
            },
            "over": {
              "price": -350,
              "links": {
                "desktop": "https://app.hardrock.bet/?deep_link_value=betslip/4322799973057704964",
                "mobile": "https://share.hardrock.bet/Pt0T/bet?deep_link_value=hardrock://betslip/4322799973057704964"
              },
              "_is_main": false
            }
          }
        }
      }
    }
  }

  try {
    // Store the odds data using the market key from your EV record
    const marketKey = 'odds:nfl:props:total:game:alts:event:64105a3e-2b4e-57c0-a377-7058ecadd2d4:pregame'
    await redis.setex(marketKey, 600, JSON.stringify(sampleOddsData))
    
    return NextResponse.json({
      success: true,
      message: 'Sample odds data created',
      data: {
        key: marketKey,
        lines: Object.keys(sampleOddsData.lines),
        ttl: 600
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sample odds data'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const marketKey = 'odds:nfl:props:total:game:alts:event:64105a3e-2b4e-57c0-a377-7058ecadd2d4:pregame'
    await redis.del(marketKey)
    
    return NextResponse.json({
      success: true,
      message: 'Sample odds data deleted'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sample odds data'
    }, { status: 500 })
  }
}


