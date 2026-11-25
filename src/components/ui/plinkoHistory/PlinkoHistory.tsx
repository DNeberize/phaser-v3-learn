import PlinkoHistoryItem from "./components/PlinkoHistoryItem.tsx";
import {useEffect, useState} from "react";
import {gameEvents} from "../../../utils/gameEvents.ts";
import type {PlinkoHistoryItemType} from "../../../utils/types/Plinko.type.ts";
import {GameEventsEnum} from "../../../utils/enums/gameEvents.enum.ts";

const paragraphClass = 'text-white font-semibold text-[14px] uppercase';
const MAX_ALL_HISTORY_ITEMS = 100;

const historyTabs = [
    {key: 'recent', title: 'Recent'},
    {key: 'all', title: 'All'},
] as const;
type HistoryTabKey = typeof historyTabs[number]['key'];

type HistoryMap = { [key: PlinkoHistoryItemType['id']]: PlinkoHistoryItemType };

const sortNewestFirst = (items: HistoryMap) =>
    Object.values(items).sort((a, b) => b.createdAt - a.createdAt);

interface Props {
    className: string
}

function PlinkoHistory({
                           className
                       }: Props) {
    const [activeTab, setActiveTab] = useState<HistoryTabKey>('recent');
    // Recent: last few drops, older ones slide out
    const [history, setHistory] = useState<HistoryMap>({})
    // All: every drop up to MAX_ALL_HISTORY_ITEMS, scrollable
    const [allHistory, setAllHistory] = useState<HistoryMap>({})

    useEffect(() => {
        const handleBallDropped = (data: PlinkoHistoryItemType) => {
            setHistory(
                (prev) => prev[data.id] ? prev : ({
                    ...prev,
                    [data.id]: data
                })
            )
            setAllHistory(
                (prev) => {
                    if (prev[data.id]) {
                        return prev;
                    }
                    const kept = sortNewestFirst(prev).slice(0, MAX_ALL_HISTORY_ITEMS - 1);
                    return {
                        ...Object.fromEntries(kept.map(item => [item.id, item])),
                        [data.id]: data
                    };
                }
            )
        };

        gameEvents.on(GameEventsEnum.BALL_DROPPED, handleBallDropped);

        return () => {
            gameEvents.off(GameEventsEnum.BALL_DROPPED, handleBallDropped)
        }
    }, [])

    const handleRemove = (id: PlinkoHistoryItemType['id']) => {
        setHistory(
            (prev) => {
                const newObj = {...prev};
                if (newObj?.[id]) {
                    delete newObj[id];
                }
                return newObj;
            }
        )
    }

    return (
        <div className={`flex flex-col gap-3 w-[342px] ${className}`}>
            <div className={'grid grid-cols-2 gap-2'}>
                {historyTabs.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type={'button'}
                            onClick={() => setActiveTab(tab.key)}
                            className={'cursor-pointer relative overflow-clip flex items-center justify-center h-7 md:h-10 backdrop-blur-[35px] border border-solid border-[#ffffff1a] rounded-[10px] md:rounded-2xl'}
                        >
                            <span
                                className={`absolute left-0 top-0 w-full h-full duration-300 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    background: 'linear-gradient(180deg, rgba(34, 13, 74, 0.5) 0%, rgba(98, 64, 162, 0.5) 100%)'
                                }}
                            />
                            <p className={`text-white text-[10px] md:text-[12px] uppercase z-10 font-semibold duration-300 ease-out ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                {tab.title}
                            </p>
                        </button>
                    );
                })}
            </div>
            <div className="grid grid-cols-4 items-center gap-3 px-2"
            >
                <p className={`${paragraphClass}`}>Time</p>
                <p className={`${paragraphClass}`}>Total Bet</p>
                <p className={`${paragraphClass}`}>payout</p>
                <p className={`${paragraphClass} text-center`}>profit</p>
            </div>
            {/* Both lists stay mounted so Recent keeps trimming itself while All is open */}
            <div className={`h-[325px] overflow-y-auto no-scrollbar ${activeTab === 'recent' ? '' : 'hidden'}`}>
                <div className={'flex flex-col gap-1'}>
                    {sortNewestFirst(history).map((item, index) => <PlinkoHistoryItem
                        key={item.id}
                        data={item}
                        handleRemove={() => handleRemove(item.id)}
                        toBeRemoved={index >= 6}
                    />)}
                </div>
            </div>
            <div className={`h-[325px] overflow-y-auto no-scrollbar ${activeTab === 'all' ? '' : 'hidden'}`}>
                <div className={'flex flex-col gap-1'}>
                    {sortNewestFirst(allHistory).map((item) => <PlinkoHistoryItem
                        key={item.id}
                        data={item}
                        handleRemove={() => {
                        }}
                        toBeRemoved={false}
                    />)}
                </div>
            </div>
        </div>
    );
}

export default PlinkoHistory;
