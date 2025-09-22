# Alternative approach - replace the upsert_listings method with this:

def upsert_listings(self, listings: List[Dict[str, Any]]) -> bool:
    """Insert or update listings in the database using individual inserts"""
    if not listings:
        logger.warning("No listings to insert")
        return True

    try:
        # Transform listings and deduplicate by listNumber
        transformed_listings = []
        seen_list_numbers = set()
        
        for listing in listings:
            try:
                transformed = self.transform_listing(listing)
                
                # Skip if we've already seen this listNumber in this batch
                list_number = transformed.get('listNumber')
                if list_number and list_number in seen_list_numbers:
                    logger.debug(f"Skipping duplicate listNumber in batch: {list_number}")
                    continue
                
                if list_number:
                    seen_list_numbers.add(list_number)
                
                transformed_listings.append(transformed)
                
            except Exception as e:
                logger.error(f"Error transforming listing {listing.get('listNumber', 'Unknown')}: {e}")
                continue

        if not transformed_listings:
            logger.warning("No valid listings after transformation and deduplication")
            return True

        # Insert records individually to avoid batch conflicts
        total_inserted = 0
        total_updated = 0
        total_skipped = 0
        
        for i, record in enumerate(transformed_listings):
            try:
                # Try insert first
                result = self.client.table('daily_listings').insert([record]).execute()
                total_inserted += 1
                
                if (i + 1) % 50 == 0:
                    logger.info(f"Progress: {i + 1}/{len(transformed_listings)} records processed")
                
            except Exception as e:
                error_msg = str(e)
                if '23505' in error_msg and 'listNumber' in error_msg:
                    # Duplicate key - try update instead
                    try:
                        list_number = record.get('listNumber')
                        if list_number:
                            # Update existing record
                            update_result = self.client.table('daily_listings').update(record).eq('listNumber', list_number).execute()
                            total_updated += 1
                        else:
                            logger.warning(f"No listNumber for record, skipping update")
                            total_skipped += 1
                    except Exception as update_error:
                        logger.error(f"Failed to update record with listNumber {record.get('listNumber')}: {update_error}")
                        total_skipped += 1
                else:
                    logger.error(f"Failed to insert record: {e}")
                    total_skipped += 1

        logger.info(f"🎉 Processing complete:")
        logger.info(f"   📝 Inserted: {total_inserted}")
        logger.info(f"   ✏️  Updated: {total_updated}")
        logger.info(f"   ⏭️  Skipped: {total_skipped}")
        logger.info(f"   📊 Total processed: {total_inserted + total_updated}")

        return (total_inserted + total_updated) > 0

    except Exception as e:
        logger.error(f"❌ Error in upsert_listings: {e}")
        import traceback
        traceback.print_exc()
        return False
